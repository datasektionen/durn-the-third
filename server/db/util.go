package db

// All functions in this file should be passed a db as a parameter,
// in order to avoid deadlocks, since all functions that should
// call functions in this file should fetch the database connection
// themself

import (
	"time"

	uuid "github.com/satori/go.uuid"
	"gorm.io/gorm"
)

func GetElectionIfPublic(db *gorm.DB, id uuid.UUID) *Election {
	election := Election{ID: id}
	if err := db.Find(&election).Preload("Candidates").Error; err != nil {
		return nil
	}
	if !election.Published || !election.OpenTime.Valid || time.Now().Before(election.OpenTime.Time) {
		return nil
	}
	return &election
}
