package actions

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

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
