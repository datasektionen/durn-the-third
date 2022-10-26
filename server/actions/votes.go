package actions

import (
	database "durn/server/db"
	"durn/server/util"
	"time"

	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	uuid "github.com/satori/go.uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func CastVote(c *gin.Context) {
	body := struct {
		IsBlank bool        `json:"blank"`
		Secret  string      `json:"secret"`
		Ranking []uuid.UUID `json:"ranking"` // Assumes candidates are ordered from highest to lowest in priority for user
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
		IsBlank:    body.IsBlank,
	}

	var hash string

	db := database.GetDB()
	defer database.ReleaseDB()

	// Validation section
	// Check that election is open for voting, that all candidates are included in the vote,
	// and that no extra candidates (or invalid ones) are accounted for
	election := database.Election{ID: electionId}
	if err := db.First(&election).Error; err != nil || !election.Published { // Information should not be leaked if elections is not public
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.InvalidElection)
	}
	if election.Finalized || !util.TimeIsInValidInterval(
		vote.VoteTime, election.OpenTime, election.CloseTime,
	) {
		c.String(http.StatusBadRequest, "Voting is not open for the specified election")
		return
	}

	var electionCandidates []uuid.UUID
	for _, candidate := range election.Candidates {
		electionCandidates = append(electionCandidates, candidate.ID)
	}
	if !vote.IsBlank && !util.SameSet(electionCandidates, body.Ranking) {
		c.String(http.StatusBadRequest, "Missing or invalid candidates in vote")
		return
	}

	if err := db.Find(&database.CastedVote{ElectionID: electionId, Email: user}); err == nil {
		c.String(http.StatusBadRequest, "User has already voted")
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

		hash, err = calculateVoteHash(&vote, user, body.Secret)
		if err != nil {
			return err
		}
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
	// by correlating positions in the database tables
	// Raises the complexity of the vote operation a lot, but should be fine for
	// the amount of traffic expected for this system
	if err := database.ReorderRows(db, "casted_votes"); err != nil {
		fmt.Println("Database failed to shuffle table casted_votes")
	}
	if err := database.ReorderRows(db, "vote_hashes"); err != nil {
		fmt.Println("Database failed to shuffle table vote_hashes")
	}

	c.String(http.StatusOK, hash)
}

func GetVotes(c *gin.Context) {

}

func CountVotes(c *gin.Context) {

}

func GetHashes(c *gin.Context) {

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

func calculateVoteHash(vote *database.Vote, secret string, user string) (string, error) {
	var voteString string
	if vote.IsBlank {
		voteString = user + secret + vote.ElectionID.String() + "Blank"
	} else {
		voteString = user + secret + vote.ElectionID.String()
		rankings := make([]uuid.UUID, len(vote.Rankings))
		for _, ranking := range vote.Rankings {
			rankings[ranking.Rank] = ranking.CandidateID
		}
		for rank, candidate := range rankings {
			voteString += fmt.Sprint(rank) + candidate.String()
		}
	}
	result, err := bcrypt.GenerateFromPassword([]byte(voteString), bcrypt.DefaultCost)
	return string(result), err
}
