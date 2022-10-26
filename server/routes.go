package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	cors "github.com/rs/cors/wrapper/gin"

	"durn/server/actions"
	"durn/server/middleware"

	"durn/server/db"
)

func InitRoutes(r *gin.RouterGroup) {

	db.InitDB()

	r.Use(cors.New(cors.Options{}))

	r.GET("/ping", func(c *gin.Context) { c.String(http.StatusOK, "pong") })

	auth := r.Group("/", middleware.Auth()...)

	auth.GET("/validate-token", actions.ValidateToken)

	write := auth.Group("/", middleware.HasPerm("admin-write"))
	read := auth.Group("/", middleware.HasPerm("admin-read"))
	vote := auth.Group("/", middleware.AllowedToVote())

	read.GET("/elections", actions.GetElections)
	read.GET("/election/:id", actions.GetElection)
	auth.GET("/elections/public", actions.GetPublicElections)
	auth.GET("/election/public/:id", actions.GetPublicElection)

	write.POST("/election/create", actions.CreateElection)
	write.PATCH("/election/:id/edit", actions.EditElection)
	write.PUT("/election/:id/publish", actions.PublishElection)
	write.PUT("/election/:id/finalize", actions.FinalizeElection)

	write.POST("/election/:id/candidate/add", actions.AddCandidate)
	write.PUT("/election/candidate/:id/edit", actions.EditCandidate)

	read.GET("/voters", actions.GetVoters)
	write.PUT("/voters/add", actions.AddVoters)
	write.DELETE("/voters/remove", actions.RemoveVoters)

	vote.POST("/election/:id/vote", actions.CastVote)
	auth.GET("/election/:id/has-voted", actions.HasVoted)
	read.POST("/election/:id/get-votes", actions.CastVote)
	read.GET("/election/:id/count", actions.CountVotes)
	read.GET("/election/:id/hashes", actions.CastVote)

}
