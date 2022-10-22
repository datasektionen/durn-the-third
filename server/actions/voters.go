package actions

import (
	"fmt"
	"net/http"

	database "durn/server/db"
	"durn/server/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"
)

func AddVoters(c *gin.Context) {
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

	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&voters).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, "Server failed to handle request")
		return
	}

	c.String(http.StatusOK, "200 OK")
}

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
