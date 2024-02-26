package main

import (
	"fmt"

	"github.com/gin-gonic/gin"

	conf "durn/config"
	server "durn/server"
)

func main() {
	r := gin.Default()

	// r.Use(static.Serve("/", static.LocalFile("./dist", true)))
	r.Static("/public", "./public")

	api := r.Group("/api")
	server.InitRoutes(api)

	r.Run(fmt.Sprintf(":%d", conf.GetConfig().PORT))
}
