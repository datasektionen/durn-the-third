package actions

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	database "durn/server/db"
	"durn/server/util"

	"github.com/gin-gonic/gin"
	uuid "github.com/satori/go.uuid"
	"gorm.io/gorm"
)

type electionExportType struct {
	ID          uuid.UUID            `gorm:"primaryKey" json:"id"`
	Name        string               `gorm:"not null" json:"name"`
	Description string               `gorm:"not null" json:"description"`
	Published   bool                 `gorm:"not null" json:"published"`
	Finalized   bool                 `gorm:"not null" json:"finalized"`
	OpenTime    util.NullTime        `json:"openTime"`
	CloseTime   util.NullTime        `json:"closeTime"`
	Candidates  []database.Candidate `gorm:"foreignKey:ElectionID;references:ID" json:"candidates"`
}

func convertElectionToExportType(election database.Election) electionExportType {
	return electionExportType{
		ID:          election.ID,
		Name:        election.Name,
		Description: election.Description,
		Published:   election.Published,
		Finalized:   election.Finalized,
		OpenTime:    util.ConvertSqlNullTime(election.OpenTime),
		CloseTime:   util.ConvertSqlNullTime(election.CloseTime),
		Candidates:  election.Candidates,
	}
}

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
	vacant := database.Candidate{
		ID:           uuid.NewV4(),
		Name:         util.VacantCandidate,
		Presentation: "",
		ElectionID:   election.ID,
		Symbolic:     true,
	}
	blank := database.Candidate{
		ID:           uuid.NewV4(),
		Name:         util.BlankCandidate,
		Presentation: "",
		ElectionID:   election.ID,
		Symbolic:     true,
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := db.Create(&election).Error; err != nil {
			return err
		}
		if err := db.Create(&vacant).Error; err != nil {
			return err
		}
		if err := db.Create(&blank).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}

	c.JSON(http.StatusOK, convertElectionToExportType(election))
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
	c.JSON(http.StatusOK, convertElectionToExportType(election))
}

// setElectionPublishedStatus sets the published status as specified
func setElectionPublishedStatus(c *gin.Context, publishedStatus bool) {
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

	election.Published = publishedStatus
	if err := db.Save(&election).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}

	c.JSON(http.StatusOK, convertElectionToExportType(election))
}

// PublishElection marks an election as published.
func PublishElection(c *gin.Context) {
	setElectionPublishedStatus(c, true)
}

// PublishElection marks an election as unpublished.
func UnpublishElection(c *gin.Context) {
	setElectionPublishedStatus(c, false)
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

	c.JSON(http.StatusOK, convertElectionToExportType(election))
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

	c.JSON(http.StatusOK, convertElectionToExportType(election))
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

	var result []electionExportType
	for _, election := range elections {
		result = append(result, convertElectionToExportType(election))
	}
	c.JSON(http.StatusOK, result)
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

	var result []electionExportType
	for _, election := range elections {
		result = append(result, convertElectionToExportType(election))
	}
	c.JSON(http.StatusOK, result)
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

	c.JSON(http.StatusOK, convertElectionToExportType(election))
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
	if body.Name == util.BlankCandidate || body.Name == util.VacantCandidate {
		c.String(http.StatusBadRequest, fmt.Sprintf("'%s' is a reserved candidate name", body.Name))
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
		Symbolic:     false,
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

// RemoveCandidate removes the specified candidate from an election,
// provided that the election it is in is not opened, finalized, or has any votes
func RemoveCandidate(c *gin.Context) {
	candidateId, err := uuid.FromString(c.Param("id"))

	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, util.BadUUID)
		return
	}

	candidate := database.Candidate{ID: candidateId}
	db := database.GetDB()
	defer database.ReleaseDB()
	if err := db.Preload("Election.Votes").First(&candidate).Error; err != nil {
		c.String(http.StatusBadRequest, "Invalid candidate specified")
		return
	}

	openTime := candidate.Election.OpenTime

	if openTime.Valid && time.Now().After(openTime.Time) {
		c.String(http.StatusBadRequest, "Can't remove candidate from opened election")
		return
	}

	if candidate.Election.Finalized {
		c.String(http.StatusBadRequest, "Can't remove candidate from finalized election")
		return
	}

	if len(candidate.Election.Votes) > 0 {
		c.String(http.StatusBadRequest, "Can't remove candidate from election with votes")
		return
	}

	if err := db.Delete(&candidate).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, util.RequestFailed)
		return
	}

	c.String(http.StatusOK, "")
}
