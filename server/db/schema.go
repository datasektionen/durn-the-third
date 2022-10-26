package db

import (
	"database/sql"
	"time"

	uuid "github.com/satori/go.uuid"
)

type Election struct {
	ID          uuid.UUID    `gorm:"primaryKey" json:"id"`
	Name        string       `gorm:"not null" json:"name"`
	Description string       `gorm:"not null" json:"description"`
	Published   bool         `gorm:"not null" json:"published"`
	Finalized   bool         `gorm:"not null" json:"finalized"`
	OpenTime    sql.NullTime `json:"openTime"`
	CloseTime   sql.NullTime `json:"closeTime"`
	Candidates  []Candidate  `gorm:"foreignKey:ElectionID;references:ID" json:"candidates"`
	Votes       []Vote       `json:"-"`
	Voters      []ValidVoter `gorm:"many2many:casted_votes" json:"-"`
}

type ValidVoter struct {
	Email string `gorm:"primaryKey"`
}

type Candidate struct {
	ID           uuid.UUID `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"not null" json:"name"`
	Presentation string    `gorm:"not null" json:"presentation"`
	ElectionID   uuid.UUID `gorm:"not null" json:"-"`
}

type VoteHash struct {
	Hash string `gorm:"primaryKey"`
}

type Vote struct {
	ID         uuid.UUID `gorm:"primaryKey"`
	IsBlank    bool      `gorm:"not null"`
	VoteTime   time.Time `gorm:"not null"`
	ElectionID uuid.UUID `gorm:"not null"`
	Rankings   []Ranking `gorm:"foreignKey:VoteID;references:ID"`
}

type Ranking struct {
	VoteID      uuid.UUID `gorm:"PrimaryKey"`
	Rank        int       `gorm:"PrimaryKey"`
	CandidateID uuid.UUID `gorm:"not null"`
}
