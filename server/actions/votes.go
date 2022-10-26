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
		Ranking []uuid.UUID `json:"ranking"` // Assumes candidates are ordered according to user ranking
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

func HasVoted(c *gin.Context) {
}

func calculateVoteHash(vote *database.Vote, secret string, user string) (string, error) {
	var voteString string
	if vote.IsBlank {
		voteString = user + secret + vote.ElectionID.String() + "Blank"
	} else {
		voteString = user + secret + vote.ElectionID.String()
		for _, rank := range vote.Rankings {
			voteString += fmt.Sprint(rank.Rank) + rank.CandidateID.String()
		}
	}
	result, err := bcrypt.GenerateFromPassword([]byte(voteString), bcrypt.DefaultCost)
	return string(result), err
}
