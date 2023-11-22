package actions

import (
	database "durn/server/db"
	"durn/server/util"
	"encoding/hex"
	"math/rand"
	"sort"
	"time"

	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	uuid "github.com/satori/go.uuid"
	"golang.org/x/crypto/sha3"
	"gorm.io/gorm"
)

// CastVote submits a vote for the logged in user to the database.
// Validates that the user has the right to vote and that it is
// possible to vote in the election at the time of the request.
// If the user already has a vote, it is replaced
func CastVote(c *gin.Context) {
	body := struct {
		Secret  string      `json:"secret"`
		Ranking []uuid.UUID `json:"ranking" binding:"required"` // Assumes candidates are ordered from highest to lowest in priority for user
	}{
		Secret: "",
	}

	electionId, err := uuid.FromString(c.Param("id"))

	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUIDMessage)
		return
	}
	if err := c.BindJSON(&body); err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadParametersMessage)
		return
	}

	userEmail := c.GetString("user")
	userHash := util.GetVoteHash(userEmail, electionId)

	vote := database.Vote{
		ID:         uuid.NewV4(),
		VoteTime:   time.Now(),
		ElectionID: electionId,
		UserHash:   userHash,
	}

	db := database.GetDB()
	defer database.ReleaseDB()

	election := database.Election{ID: electionId}

	// Validation section
	// Check that election is open for voting, that the user hasn't voted already,
	// that all candidates are accounted for the vote, and that no extra candidates
	// (or invalid ones) are included
	{
		if err := db.Preload("Candidates").First(&election).Error; err != nil { // Information should not be leaked if elections is not public
			fmt.Println(err)
			c.String(http.StatusBadRequest, util.InvalidElectionMessage)
			return
		}
		if election.Finalized || !util.TimeIsInValidInterval(
			vote.VoteTime, election.OpenTime, election.CloseTime,
		) {
			c.String(http.StatusBadRequest, "Voting is not open for the specified election")
			return
		}
		// feature-change: allow changing vote
		// if db.Find(&database.CastedVote{ElectionID: electionId, Email: user}).RowsAffected > 0 {
		// 	c.String(http.StatusBadRequest, "User has already voted")
		// 	return
		// }
		var electionCandidates []uuid.UUID
		for _, candidate := range election.Candidates {
			electionCandidates = append(electionCandidates, candidate.ID)
		}
		if !util.SameSet(electionCandidates, body.Ranking) {
			c.String(http.StatusBadRequest, "Missing or invalid candidates in vote")
			return
		}
	}

	// Insertion section
	if err := db.Transaction(func(tx *gorm.DB) error {

		existingVote := &database.Vote{}
		if err := tx.Where("user_hash", userHash).First(&existingVote).Error; err != nil { // this throws an error in the log, which is intended, but not nice

			if err := tx.Create(&vote).Error; err != nil {
				return err
			}

			if err := tx.Create(&database.CastedVote{
				Email:      userEmail,
				ElectionID: electionId,
			}).Error; err != nil {
				return err
			}

		} else {
			vote = *existingVote
			tx.Delete(&database.Ranking{}, "vote_id", vote.ID)
		}

		for rank, candidateID := range body.Ranking {
			ranking := database.Ranking{
				VoteID:      vote.ID,
				Rank:        rank,
				CandidateID: candidateID,
			}
			if err := tx.Create(&ranking).Error; err != nil {
				return err
			}
			vote.Rankings = append(vote.Rankings, ranking)
		}

		// hash = calculateVoteHash(&vote, user, body.Secret)

		// if err := tx.Create(&database.VoteHash{
		// 	Hash:       hash,
		// 	ElectionID: electionId,
		// }).Error; err != nil {
		// 	return err
		// }

		return nil
	}); err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailedMessage)
		return
	}

	// Tables are shuffled to prevent that votes can be associated with a person
	// by correlating positions in the database tables.
	// Raises the time complexity of the vote operation a lot, but should be
	// fine for the amount of traffic expected for this system.

	// if err := database.ReorderRows(db, "casted_votes"); err != nil {
	// 	fmt.Println("Database failed to shuffle table casted_votes")
	// }
	// if err := database.ReorderRows(db, "vote_hashes"); err != nil {
	// 	fmt.Println("Database failed to shuffle table vote_hashes")
	// }

	c.String(http.StatusOK, "")
}

// GetVotes returns all votes for a specific election, in the same format as
// the request body for casting a vote, with an timestamp added.
func GetVotes(c *gin.Context) {
	electionId, err := uuid.FromString(c.Param("id"))
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUIDMessage)
		return
	}

	db := database.GetDB()
	defer database.ReleaseDB()

	var votes []database.Vote
	if err := db.Preload("Rankings").Find(&votes, "election_id = ?", electionId).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailedMessage)
		return
	}

	type responseType struct {
		Time       time.Time   `json:"time"`
		IsBlank    bool        `json:"blank"`
		ElectionID uuid.UUID   `json:"election"`
		Rankings   []uuid.UUID `json:"rankings"`
	}

	var response []responseType
	for _, vote := range votes {
		respVote := responseType{
			Time:       vote.VoteTime,
			ElectionID: vote.ElectionID,
			Rankings:   make([]uuid.UUID, len(vote.Rankings)),
		}
		for _, ranking := range vote.Rankings {
			respVote.Rankings[ranking.Rank] = ranking.CandidateID
		}

		response = append(response, respVote)
	}

	c.JSON(http.StatusOK, response)
}

// CountVotes calculates the winner of an election using the "Alternativsomröstning" algorithm,
// as described in https://styrdokument.datasektionen.se/reglemente (§3.12.7 Urnval)
// Expects there to be  token candidates for a vacant spot and a blank vote, which it
// treats differently, but works without them.
// Does not handle the case where the two lowest candidates have the same amount of votes
// in a good way (it is probably random) since it is not handled in the algorithm specification
func CountVotes(c *gin.Context) {
	electionId, err := uuid.FromString(c.Param("id"))
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUIDMessage)
		return
	}

	db := database.GetDB()
	election := database.Election{ID: electionId}
	if err := db.Preload("Votes.Rankings").Preload("Candidates").First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.InvalidElectionMessage)
		return
	}
	database.ReleaseDB()
	if !election.Finalized {
		c.String(http.StatusBadRequest, "Can't count votes of unfinalized election")
		return
	}
	if len(election.Votes) == 0 {
		c.String(http.StatusBadRequest, "Election has no votes")
		return
	}

	candidateEliminated := make(map[uuid.UUID]bool)
	candidateNames := make(map[uuid.UUID]string)
	for _, candidate := range election.Candidates {
		candidateNames[candidate.ID] = candidate.Name
		candidateEliminated[candidate.ID] = false
	}

	var voterRankings [][]uuid.UUID
	for _, vote := range election.Votes {
		ranking := make([]uuid.UUID, len(vote.Rankings))
		for _, rank := range vote.Rankings {
			ranking[rank.Rank] = rank.CandidateID
		}
		voterRankings = append(voterRankings, ranking)
	}

	type candidateResult struct {
		Name       string `json:"name"`
		Votes      int    `json:"votes"`
		Eliminated bool   `json:"eliminated"`
	}
	type voteStage struct {
		Candidates []candidateResult `json:"candidates"`
		Blanks     int               `json:"blanks"`
	}
	var electionResult []voteStage

	for {
		var stageResult voteStage
		count := make(map[uuid.UUID]int)

		for _, vote := range voterRankings {
			for _, candidate := range vote {
				if !candidateEliminated[candidate] {
					count[candidate] += 1
					break
				}
			}
		}

		var eliminate uuid.UUID
		chosenElimination := false
		total := 0
		for candidate, votes := range count {
			if candidateNames[candidate] == util.BlankCandidate {
				stageResult.Blanks = votes
				continue
			}
			total += votes
			if candidateNames[candidate] != util.VacantCandidate {
				if !chosenElimination || count[eliminate] > count[candidate] {
					eliminate = candidate
					chosenElimination = true
				}
			}
		}
		candidateEliminated[eliminate] = true

		for candidate, votes := range count {
			if candidateNames[candidate] == util.BlankCandidate {
				continue
			}
			stageResult.Candidates = append(stageResult.Candidates, candidateResult{
				Name:       candidateNames[candidate],
				Votes:      votes,
				Eliminated: candidate == eliminate,
			})
		}

		sort.Slice(stageResult.Candidates, func(i, j int) bool {
			return stageResult.Candidates[i].Votes > stageResult.Candidates[j].Votes
		})

		if stageResult.Candidates[0].Votes*2 > total {
			electionResult = append(electionResult, stageResult)
			break
		}
		electionResult = append(electionResult, stageResult)
	}

	c.JSON(http.StatusOK, electionResult)
}

// Counts votes of an election according to the schultze method
//
// https://en.wikipedia.org/wiki/Schulze_method
func CountVotesSchultze(c *gin.Context) {
	electionId, err := uuid.FromString(c.Param("id"))
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUIDMessage)
		return
	}

	db := database.GetDB()
	election := database.Election{ID: electionId}
	if err := db.Preload("Votes.Rankings").Preload("Candidates").First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.InvalidElectionMessage)
		return
	}
	database.ReleaseDB()
	if !election.Finalized {
		c.String(http.StatusBadRequest, "Can't count votes of unfinalized election")
		return
	}
	if len(election.Votes) == 0 {
		c.String(http.StatusBadRequest, "Election has no votes")
		return
	}

	candidateIndexes := make(map[uuid.UUID]int)
	N := len(election.Candidates)

	// prefer[i][j] is the amount of voters that prefer candidate i to candidate j
	prefer := make([][]int, N)

	for idx, candidate := range election.Candidates {
		candidateIndexes[candidate.ID] = idx
		prefer[idx] = make([]int, N)
		for j := 0; j < N; j++ {
			prefer[idx][j] = 0
		}
	}

	for _, vote := range election.Votes {
		for i, a := range vote.Rankings {
			for _, b := range vote.Rankings[i+1 : N] {
				aIdx := candidateIndexes[a.CandidateID]
				bIdx := candidateIndexes[b.CandidateID]
				prefer[aIdx][bIdx] += 1
			}
		}
	}

	p := StrongestPaths(prefer)

	result := make([]int, N)
	for i := range prefer {
		result[i] = i
	}
	// Since we use stable sort, shuffling before sorting is equivalent to randomizing the order
	// between candidates which were tied
	rand.Shuffle(len(result), func(i, j int) {
		result[i], result[j] = result[j], result[i]
	})
	sort.SliceStable(result, func(i, j int) bool {
		a := result[i]
		b := result[j]
		return p[a][b] >= p[b][a]
	})

	type responseType struct {
		Ranking        []database.Candidate `json:"ranking"`
		TotalVotes     int                  `json:"totalVotes"`
		VoteMatrix     [][]int              `json:"voteMatrix"`
		SchultzeMatrix [][]int              `json:"schultzeMatrix"`
	}

	// var ret []database.Candidate
	var ret responseType
	ret.TotalVotes = len(election.Votes)

	for _, idx := range result {
		ret.Ranking = append(ret.Ranking, election.Candidates[idx])
		var votesRow []int
		var schultzeRow []int
		for _, idx2 := range result {
			votesRow = append(votesRow, prefer[idx][idx2])
			schultzeRow = append(schultzeRow, p[idx][idx2])
		}
		ret.VoteMatrix = append(ret.VoteMatrix, votesRow)
		ret.SchultzeMatrix = append(ret.SchultzeMatrix, schultzeRow)
	}

	c.JSON(http.StatusOK, ret)
}

func StrongestPaths(E [][]int) [][]int {
	res := util.Copy2DSlice(E)
	for k := range E {
		for i := range E {
			for j := range E {
				if i != j && j != k && k != i {
					res[i][j] = util.Max(
						res[i][j],
						util.Min(res[i][k], res[k][j]),
					)
				}
			}
		}
	}

	return res
}

// GetHashes returns all hashes in the database. Requires user to be able to vote.
func GetHashes(c *gin.Context) {
	// TODO: possibly add electionID to database for hashes, since it would be nice
	// to be able to filter by that and only allow fetching from finalized elections
	db := database.GetDB()
	defer database.ReleaseDB()

	var hashes []database.VoteHash
	if err := db.Find(&hashes).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailedMessage)
		return
	}
	var response []string
	for _, hash := range hashes {
		response = append(response, hash.Hash)
	}

	c.JSON(http.StatusOK, response)
}

// HasVoted checks if there is a record in the database for the specified election
// for the user that is requesting.
func HasVoted(c *gin.Context) {
	electionId, err := uuid.FromString(c.Param("id"))
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUIDMessage)
		return
	}
	user := c.GetString("user")

	db := database.GetDB()
	defer database.ReleaseDB()

	if db.Find(&database.CastedVote{ElectionID: electionId, Email: user}).RowsAffected == 0 {
		c.String(http.StatusOK, "false")
		return
	}
	c.String(http.StatusOK, "true")
}

// calculateVoteHash uses sha3-256 on a string representation of a vote with the format:
// "[user-email]_[secret]_[election-id]_<vote>"
// where <vote> is:
// - "_[rank]_[candidate-id]" (repeated for each candidate in the vote) otherwise
func calculateVoteHash(vote *database.Vote, user string, secret string) string {
	voteString := fmt.Sprintf("%s_%s_%s", user, secret, vote.ElectionID.String())
	rankings := make([]uuid.UUID, len(vote.Rankings))
	for _, ranking := range vote.Rankings {
		rankings[ranking.Rank] = ranking.CandidateID
	}
	for rank, candidate := range rankings {
		voteString += fmt.Sprintf("_%d:%s", rank, candidate.String())
	}
	result := sha3.Sum256([]byte(voteString))
	return hex.EncodeToString(result[:])
}
