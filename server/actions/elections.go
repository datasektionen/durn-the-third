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

// CreateElection creates an election with the given name.
// All other fields are set to their defaults and has to be changed
// using the edit endpoint.
// Default values:
// - Description: ""
// - OpenTime, CloseTime: null
// - Published, Finalized: false
func CreateElection(c *gin.Context) {
	body := struct {
		Name string `json:"name" binding:"required"`
	}{}

	if err := c.BindJSON(&body); err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadParameters)
		return
	}

	db := database.GetDB()
	defer database.ReleaseDB()
	election := database.Election{
		ID:          uuid.NewV4(),
		Name:        body.Name,
		Description: "",
		OpenTime:    sql.NullTime{Valid: false},
		CloseTime:   sql.NullTime{Valid: false},
		Published:   false,
		Finalized:   false,
	}
	if err := db.Create(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}

	c.JSON(http.StatusOK, election)
}

// EditElection updates specific fields for the specified election.
// Individual fields can be skipped in the request body. All skipped fields
// will not be affected in the database.
// Allowed fields are: Name, Description, OpenTime, CloseTime
func EditElection(c *gin.Context) {
	body := struct {
		Name        *string        `json:"name"`
		Description *string        `json:"description"`
		OpenTime    *util.NullTime `json:"openTime"`
		CloseTime   *util.NullTime `json:"closeTime"`
	}{}
	electionId, err := uuid.FromString(c.Param("id"))

	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUID)
		return
	}
	if err := c.BindJSON(&body); err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadParameters)
		return
	}

	election := database.Election{ID: electionId}
	db := database.GetDB()
	defer database.ReleaseDB()
	if err := db.Preload("Candidates").First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.InvalidElection)
		return
	}

	if election.Finalized {
		fmt.Println("User tried to edit election after it had been finalized")
		c.String(http.StatusBadRequest, "Can't edit finalized election")
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
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}
	c.JSON(http.StatusOK, election)
}

// PublishElection marks an election as published.
// Note that there is no endpoint for unpublishing elections.
func PublishElection(c *gin.Context) {
	electionId, err := uuid.FromString(c.Param("id"))
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUID)
		return
	}

	election := database.Election{ID: electionId}
	db := database.GetDB()
	defer database.ReleaseDB()
	if err := db.Preload("Candidates").First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.InvalidElection)
		return
	}

	election.Published = true
	if err := db.Save(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}

	c.JSON(http.StatusOK, election)
}

// FinalizeElection marks an election as finalized, meaning that voting is finished
// and enabling vote counting.
// Note that there is no endpoint for unfinalizing elections.
func FinalizeElection(c *gin.Context) {
	electionId, err := uuid.FromString(c.Param("id"))
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUID)
		return
	}

	election := database.Election{ID: electionId}
	db := database.GetDB()
	defer database.ReleaseDB()
	if err := db.Preload("Candidates").First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.InvalidElection)
		return
	}

	election.Finalized = true
	if err := db.Save(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}
	c.JSON(http.StatusOK, election)
}

// GetElection fetches a specific election from the database, including
// all candidates in the election.
func GetElection(c *gin.Context) {
	electionId, err := uuid.FromString(c.Param("id"))
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUID)
		return
	}

	db := database.GetDB()
	defer database.ReleaseDB()

	election := database.Election{ID: electionId}
	if err := db.Preload("Candidates").First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.InvalidElection)
		return
	}

	c.JSON(http.StatusOK, election)
}

// GetElections fetches all elections in the database, including all
// candidates in the elections.
func GetElections(c *gin.Context) {
	db := database.GetDB()
	defer database.ReleaseDB()

	var elections []database.Election
	if err := db.Preload("Candidates").Find(&elections).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.InvalidElection)
		return
	}

	c.JSON(http.StatusOK, elections)
}

// GetPublicElections fetches all elections in the database with the
// published flag set to true.
func GetPublicElections(c *gin.Context) {
	db := database.GetDB()
	defer database.ReleaseDB()

	var elections []database.Election
	if err := db.Where("Published").Preload("Candidates").Find(&elections).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}

	c.JSON(http.StatusOK, elections)
}

// GetPublicElections fetches an elections in the database if the
// published flag set to true. If no there exist an election with the
// given id that is not published, the same error is returned as when
// there is no election with that id.
func GetPublicElection(c *gin.Context) {
	electionId, err := uuid.FromString(c.Param("id"))
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUID)
		return
	}

	db := database.GetDB()
	defer database.ReleaseDB()
	// election := database.FetchElectionIfPublic(db, electionId)

	election := database.Election{ID: electionId}
	if err := db.Where("Published").Preload("Candidates").First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.InvalidElection)
		return
	}

	c.JSON(http.StatusOK, election)
}

// AddCandidate adds a candidate to the specified election. The name parameter
// needs to be specified, presentation is defaulted to "" if not present.
// Note that candidates can not be added to elections after they have been published
func AddCandidate(c *gin.Context) {
	body := struct {
		Name         string `json:"name" binding:"required"`
		Presentation string `json:"presentation"`
	}{
		Presentation: "",
	}
	electionId, err := uuid.FromString(c.Param("id"))

	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUID)
		return
	}
	if err := c.BindJSON(&body); err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadParameters)
		return
	}

	db := database.GetDB()
	defer database.ReleaseDB()

	election := database.Election{ID: electionId}
	if err := db.First(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.InvalidElection)
		return
	}

	if election.Published {
		fmt.Println("User tried to add candidate to published election")
		c.String(http.StatusMethodNotAllowed, "Can't add candidate to published Election")
		return
	}

	candidate := database.Candidate{
		ID:           uuid.NewV4(),
		Name:         body.Name,
		Presentation: body.Presentation,
		ElectionID:   electionId,
	}
	if err := db.Create(&candidate).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}
	c.JSON(http.StatusOK, candidate)
}

// EditCandidate modifies the specified candidate. Fields that are not included in
// request body will not be changed in the database
func EditCandidate(c *gin.Context) {
	body := struct {
		Name         *string `json:"name"`
		Presentation *string `json:"presentation"`
	}{}
	candidateId, err := uuid.FromString(c.Param("id"))

	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUID)
		return
	}
	if err := c.BindJSON(&body); err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadParameters)
		return
	}

	candidate := database.Candidate{ID: candidateId}
	db := database.GetDB()
	defer database.ReleaseDB()
	if err := db.First(&candidate).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "Invalid candidate specified")
		return
	}

	if body.Name != nil {
		candidate.Name = *body.Name
	}
	if body.Presentation != nil {
		candidate.Presentation = *body.Presentation
	}
	if err := db.Save(&candidate).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}
	c.JSON(http.StatusOK, candidate)
}
