package actions

import (
	"fmt"
	"net/http"

	database "durn/server/db"
	"durn/server/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// AddVoters takes a list of email addresses and adds them all to the
// database table `valid_voters`. It silently skips all strings that are
// not valid email addresses and addresses that are already in the database
func AddVoters(c *gin.Context) {
	body := struct {
		Voters []string `json:"voters" binding:"required"`
	}{}

	if err := c.BindJSON(&body); err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadParameters)
		return
	}

	var voters []database.ValidVoter
	for _, voter := range body.Voters {
		if util.ValidEmail(voter) {
			voters = append(voters, database.ValidVoter{Email: voter})
		}
	}

	db := database.GetDB()
	defer database.ReleaseDB()

	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&voters).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}

	result, err := getAllVoters(db)
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}
	c.JSON(http.StatusOK, result)
}

// RemoveVoters takes a list of email addresses and removes them from the database.
// Ignores addresses that are not in the database
func RemoveVoters(c *gin.Context) {
	body := struct {
		Voters []string `json:"voters" binding:"required"`
	}{}

	if err := c.BindJSON(&body); err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadParameters)
		return
	}

	var voters []database.ValidVoter
	for _, voter := range body.Voters {
		voters = append(voters, database.ValidVoter{Email: voter})
	}

	db := database.GetDB()
	defer database.ReleaseDB()

	if err := db.Delete(&voters).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}

	result, err := getAllVoters(db)
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}
	c.JSON(http.StatusOK, result)
}

// GetVoters fetches all current allowed voters from the database
func GetVoters(c *gin.Context) {
	db := database.GetDB()
	defer database.ReleaseDB()

	result, err := getAllVoters(db)
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}
	c.JSON(http.StatusOK, result)
}

// UserAllowedToVote checks if the logged in voter is allowed to vote.
// Assumes that voting-privilege middleware has been run before the handler
func UserAllowedToVote(c *gin.Context) {
	c.JSON(http.StatusOK, "true")
}

type votersResponse struct {
	Voters []string `json:"voters"`
}

// getAllVoters fetches all current voters from the database and returns them in a response ready way
func getAllVoters(db *gorm.DB) (votersResponse, error) {
	var result votersResponse
	var voters []database.ValidVoter
	if err := db.Find(&voters).Error; err != nil {
		return result, err
	}
	result.Voters = []string{}
	for _, voter := range voters {
		result.Voters = append(result.Voters, voter.Email)
	}
	return result, nil
}
