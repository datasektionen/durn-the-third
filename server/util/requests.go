package util

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	uuid "github.com/satori/go.uuid"
)

func TryParseUuidInPath(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.FromString(c.Param("id"))
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Malformed UUID specified")
		return id, false
	}
	return id, true
}

func TryParseJsonBody[T interface{}](c *gin.Context, body *T) bool {
	if err := c.BindJSON(&body); err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Malformed or missing parameters in body")
		return false
	}
	return true
}
