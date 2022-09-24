package server

import (
	"github.com/gin-gonic/gin"
)

func InitRoutes(r *gin.RouterGroup) {

	// r.Use(Authenticate())
	r.GET("/ping", func(c *gin.Context) { c.Writer.Write([]byte("pong")) })
	// r.use()
}
