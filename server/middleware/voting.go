package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	database "durn/server/db"
)

// AllowedToVote is a middleware that checks if the user is allowed to vote.
// If they are not, the request is interrupted
// Assumes Auth middleware has been run before
func AllowedToVote() gin.HandlerFunc {
	return func(c *gin.Context) {
		user := c.GetString("User")

		db := database.GetDB()
		defer database.ReleaseDB()

		if err := db.First(&database.ValidVoter{Email: user}).Error; err != nil {
			c.String(http.StatusForbidden, "Not registered as a valid voter")
			return
		}
		c.Next()
	}
}
