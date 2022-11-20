package actions

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	database "durn/server/db"
)

func NukeElections(c *gin.Context) {
	db := database.GetDB()

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("1=1").Delete(&database.Ranking{}).Error; err != nil {
			return err
		}
		if err := tx.Where("1=1").Delete(&database.Vote{}).Error; err != nil {
			return err
		}
		if err := tx.Where("1=1").Delete(&database.VoteHash{}).Error; err != nil {
			return err
		}
		if err := tx.Where("1=1").Delete(&database.Candidate{}).Error; err != nil {
			return err
		}
		if err := tx.Where("1=1").Delete(&database.CastedVote{}).Error; err != nil {
			return err
		}
		if err := tx.Where("1=1").Delete(&database.Election{}).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, "Deletion of tables failed")
		return
	}

	c.String(http.StatusOK, "")
}
