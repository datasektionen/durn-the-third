package actions

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ValidateToken responds with the email and all permissions associated with a login token.
// Assumes that Authorization and Authentication middleware has been run before this function.
func ValidateToken(c *gin.Context) {

	res := struct {
		User  string   `json:"user"`
		Perms []string `json:"perms"`
	}{
		User:  c.GetString("user"),
		Perms: c.Keys["perms"].([]string),
	}

	c.JSON(http.StatusOK, res)
}
