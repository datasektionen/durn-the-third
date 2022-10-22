package actions

import (
	"fmt"
	"net/http"

	database "durn/server/db"
	"durn/server/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"
)

// AddVoters takes a list of email addresses and adds them all to the
// database table `valid_voters`. It silently skips all strings that are
// not valid email addresses and addresses that are already in the database
func AddVoters(c *gin.Context) {
	body := struct {
		Voters []string `json:"voters" binding:"required"`
	}{}

	if !util.TryParseJsonBody(c, &body) {
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
		c.String(http.StatusInternalServerError, "Server failed to handle request")
		return
	}

	c.String(http.StatusOK, "200 OK")
}

// RemoveVoters takes a list of email addresses and removes them from the database.
// Ignores addresses that are not in the database
func RemoveVoters(c *gin.Context) {
	body := struct {
		Voters []string `json:"voters" binding:"required"`
	}{}

	if !util.TryParseJsonBody(c, &body) {
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
		c.String(http.StatusInternalServerError, "Server failed to handle request")
		return
	}

	c.String(http.StatusOK, "200 OK")
}
