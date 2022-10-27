package actions

import (
	database "durn/server/db"
	"durn/server/util"
	"encoding/hex"
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
func CastVote(c *gin.Context) {
	body := struct {
		Secret  string      `json:"secret" binding:"required"`
		Ranking []uuid.UUID `json:"ranking" binding:"required"` // Assumes candidates are ordered from highest to lowest in priority for user
	}{}

	electionId, err := uuid.FromString(c.Param("id"))

	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUID)
		return
	}
	if err := c.BindJSON(&body); err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadParameters)
		return
	}

	user := c.GetString("user")
	vote := database.Vote{
		ID:         uuid.NewV4(),
		VoteTime:   time.Now(),
		ElectionID: electionId,
	}

	var hash string

	db := database.GetDB()
	defer database.ReleaseDB()

	// Validation section
	// Check that election is open for voting, that the user hasn't voted already,
	// that all candidates are accounted for the vote, and that no extra candidates
	// (or invalid ones) are included
	election := database.Election{ID: electionId}
	if err := db.Preload("Candidates").First(&election).Error; err != nil || !election.Published { // Information should not be leaked if elections is not public
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.InvalidElection)
	}
	if election.Finalized || !util.TimeIsInValidInterval(
		vote.VoteTime, election.OpenTime, election.CloseTime,
	) {
		c.String(http.StatusBadRequest, "Voting is not open for the specified election")
		return
	}
	if db.Find(&database.CastedVote{ElectionID: electionId, Email: user}).RowsAffected > 0 {
		c.String(http.StatusBadRequest, "User has already voted")
		return
	}

	var electionCandidates []uuid.UUID
	for _, candidate := range election.Candidates {
		electionCandidates = append(electionCandidates, candidate.ID)
	}
	if !util.SameSet(electionCandidates, body.Ranking) {
		c.String(http.StatusBadRequest, "Missing or invalid candidates in vote")
		return
	}

	// Insertion section
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&vote).Error; err != nil {
			return err
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

		hash = calculateVoteHash(&vote, user, body.Secret)

		if err := tx.Create(&database.CastedVote{
			Email:      user,
			ElectionID: electionId,
		}).Error; err != nil {
			return err
		}
		if err := tx.Create(&database.VoteHash{Hash: hash}).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}

	// Tables are shuffled to prevent that votes can be associated with a person
	// by correlating positions in the database tables.
	// Raises the time complexity of the vote operation a lot, but should be
	// fine for the amount of traffic expected for this system.
	if err := database.ReorderRows(db, "casted_votes"); err != nil {
		fmt.Println("Database failed to shuffle table casted_votes")
	}
	if err := database.ReorderRows(db, "vote_hashes"); err != nil {
		fmt.Println("Database failed to shuffle table vote_hashes")
	}

	c.String(http.StatusOK, hash)
}

// GetVotes returns all votes for a specific election, in the same format as
// the request body for casting a vote, with an timestamp added.
func GetVotes(c *gin.Context) {
	electionId, err := uuid.FromString(c.Param("id"))
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUID)
		return
	}

	db := database.GetDB()
	defer database.ReleaseDB()

	var votes []database.Vote
	if err := db.Preload("Rankings").Find(&votes, "election_id = ?", electionId).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
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
			IsBlank:    vote.IsBlank,
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

func CountVotes(c *gin.Context) {

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
		c.String(http.StatusInternalServerError, util.RequestFailed)
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
		c.String(http.StatusBadRequest, util.BadUUID)
		return
	}
	user := c.GetString("user")

	db := database.GetDB()
	defer database.ReleaseDB()

	if err := db.Find(&database.CastedVote{ElectionID: electionId, Email: user}).Error; err != nil {
		c.String(http.StatusOK, "false")
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
