package actions

import (
	"database/sql"
	"fmt"
	"net/http"

	database "durn/server/db"
	"durn/server/util"

	"github.com/gin-gonic/gin"
	uuid "github.com/satori/go.uuid"
)

func CreateElection(c *gin.Context) {
	body := struct {
		Name string `json:"name" binding:"required"`
	}{}

	if !util.TryParseJsonBody(c, &body) {
		return
	}

	fmt.Println(body)

	db := database.GetDB()
	defer database.ReleaseDB()
	db.Create(&database.Election{
		ID:          uuid.NewV4(),
		Name:        body.Name,
		Description: "",
		OpenTime:    sql.NullTime{Valid: false},
		CloseTime:   sql.NullTime{Valid: false},
		Published:   false,
		Finalized:   false,
	})

	c.String(http.StatusOK, "200 OK")
}

func EditElection(c *gin.Context) {
	electionId, success := util.TryParseUuidInPath(c)
	body := struct {
		Name        *string        `json:"name"`
		Description *string        `json:"description"`
		OpenTime    *util.NullTime `json:"openTime"`
		CloseTime   *util.NullTime `json:"closeTime"`
	}{}

	if !success || !util.TryParseJsonBody(c, &body) {
		return
	}

	election := database.Election{ID: electionId}
	db := database.GetDB()
	defer database.ReleaseDB()
	if err := db.First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Invalid election specified")
		return
	}

	if body.Name != nil {
		election.Name = *body.Name
	}
	if body.Description != nil {
		election.Description = *body.Description
	}
	if body.OpenTime != nil {
		election.OpenTime = util.ConvertNullTime(*body.OpenTime)
	}
	if body.CloseTime != nil {
		election.CloseTime = util.ConvertNullTime(*body.CloseTime)
	}
	if err := db.Save(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, "500 Internal Server Error: Server failed to handle request")
		return
	}
	c.String(http.StatusOK, "200 OK")
}

func GetElection(c *gin.Context) {
	electionId, success := util.TryParseUuidInPath(c)
	if !success {
		return
	}

	db := database.GetDB()
	defer database.ReleaseDB()

	election := database.Election{ID: electionId}
	if err := db.Preload("Candidates").First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Invalid election specified")
		return
	}

	c.JSON(http.StatusOK, election)
}

func PublishElection(c *gin.Context) {
	electionId, success := util.TryParseUuidInPath(c)
	if !success {
		return
	}

	election := database.Election{ID: electionId}
	db := database.GetDB()
	defer database.ReleaseDB()
	if err := db.First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Invalid election specified")
		return
	}

	election.Published = true
	if err := db.Save(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, "500 Internal Server Error: Server failed to handle request")
		return
	}

	c.String(http.StatusOK, "200 OK")
}

func FinalizeElection(c *gin.Context) {
	electionId, success := util.TryParseUuidInPath(c)
	if !success {
		return
	}

	election := database.Election{ID: electionId}
	db := database.GetDB()
	defer database.ReleaseDB()
	if err := db.First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Invalid election specified")
		return
	}

	election.Finalized = true
	if err := db.Save(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, "500 Internal Server Error: Server failed to handle request")
		return
	}

	c.String(http.StatusOK, "200 OK")
}

func GetElections(c *gin.Context) {
	db := database.GetDB()
	defer database.ReleaseDB()

	var elections []database.Election
	if err := db.Preload("Candidates").Find(&elections).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Invalid election specified")
		return
	}

	c.JSON(http.StatusOK, elections)
}

func GetPublicElections(c *gin.Context) {
	db := database.GetDB()
	defer database.ReleaseDB()

	var elections []database.Election
	if err := db.Where("Published").Preload("Candidates").Find(&elections).Error; err != nil {

		fmt.Println(err)
		c.String(http.StatusBadRequest, "500 Internal Server Error: Server failed to handle request")
		return
	}

	c.JSON(http.StatusOK, elections)
}

func GetPublicElection(c *gin.Context) {
	electionId, success := util.TryParseUuidInPath(c)
	if !success {
		return
	}

	db := database.GetDB()
	defer database.ReleaseDB()
	// election := database.FetchElectionIfPublic(db, electionId)

	election := database.Election{ID: electionId}
	if err := db.Where("Published").Preload("Candidates").First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Invalid election specified")
		return
	}

	c.JSON(http.StatusOK, election)
}

func AddCandidate(c *gin.Context) {
	electionId, success := util.TryParseUuidInPath(c)
	body := struct {
		Name         string `json:"name" binding:"required"`
		Presentation string `json:"presentation"`
	}{
		Presentation: "",
	}

	if !success || !util.TryParseJsonBody(c, &body) {
		return
	}

	db := database.GetDB()
	defer database.ReleaseDB()

	if err := db.First(&database.Election{ID: electionId}).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Invalid election specified")
		return
	}

	if err := db.Create(&database.Candidate{
		ID:           uuid.NewV4(),
		Name:         body.Name,
		Presentation: body.Presentation,
		ElectionID:   electionId,
	}).Error; err != nil {
		fmt.Println(err)
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	c.String(http.StatusOK, "200 OK")
}

func EditCandidate(c *gin.Context) {
	candidateId, success := util.TryParseUuidInPath(c)
	body := struct {
		Name         string `json:"name" binding:"required"`
		Presentation string `json:"presentation" binding:"required"`
	}{}
	if !success || util.TryParseJsonBody(c, &body) {
		return
	}

	candidate := database.Candidate{ID: candidateId}
	db := database.GetDB()
	defer database.ReleaseDB()
	if err := db.First(&candidate).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Invalid candidate specified")
		return
	}
	candidate.Name = body.Name
	candidate.Presentation = body.Presentation
	if err := db.Save(&candidate).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, "500 Internal Server Error: Server failed to handle request")
		return
	}
	c.String(http.StatusOK, "200 OK")
}
