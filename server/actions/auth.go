package actions

import (
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// ValidateToken responds with the email and all permissions associated with a login token.
// Assumes that Authorization and Authentication middleware has been run before this function.
func Login(c *gin.Context) {
	if c.GetString("userid") == "" {
		c.Abort()
		c.String(http.StatusUnauthorized, "Not logged in")
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, "/")
}

func Logout(c *gin.Context) {
	s := sessions.Default(c)
	s.Clear()
	s.Save()
	c.Redirect(http.StatusTemporaryRedirect, "/")
}

func CheckLogin(c *gin.Context) {
	s := sessions.Default(c)
	if s.Get("user") == nil {
		c.String(http.StatusUnauthorized, "Not logged in")
		c.Abort()
		return
	}

	res := struct {
		User  string   `json:"user"`
		Perms []string `json:"perms"`
	}{
		User:  s.Get("user").(string),
		Perms: s.Get("perms").([]string),
	}

	c.JSON(http.StatusOK, res)
}
