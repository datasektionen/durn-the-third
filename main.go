package main

import (
	"fmt"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"

	conf "durn/config"
	server "durn/server"
)

func main() {
	r := gin.Default()

	store := cookie.NewStore([]byte("secret"))
	r.Use(sessions.Sessions("session", store))

	r.Use(static.Serve("/", static.LocalFile("./dist", true)))
	r.Static("/public", "./public")

	api := r.Group("/api")
	server.InitRoutes(api)

	r.Run(fmt.Sprintf(":%d", conf.GetConfig().PORT))
}
