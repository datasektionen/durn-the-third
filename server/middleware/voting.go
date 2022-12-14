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
		user := c.GetString("user")

		db := database.GetDB()
		if db.Find(&database.ValidVoter{Email: user}).RowsAffected == 0 {
			c.String(http.StatusForbidden, "Not registered as a valid voter")
			c.Abort()
			database.ReleaseDB()
			return
		}
		database.ReleaseDB()
		c.Next()
	}
}
