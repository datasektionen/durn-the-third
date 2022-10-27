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
}

type ValidVoter struct {
	UserID string `gorm:"primaryKey"`
}

type CastedVote struct {
	UserID     string     `gorm:"primaryKey"`
	ElectionID uuid.UUID  `gorm:"primaryKey"`
	User       ValidVoter `gorm:"foreignKey:UserID;references:UserID"`
	Election   Election   `gorm:"foreignKey:ID;references:ElectionID"`
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
	VoteTime   time.Time `gorm:"not null"`
	IsBlank    bool      `gorm:"not null"`
	ElectionID uuid.UUID `gorm:"not null"`
	Rankings   []Ranking `gorm:"foreignKey:VoteID;references:ID"`
}

type Ranking struct {
	VoteID      uuid.UUID `gorm:"PrimaryKey"`
	Rank        int       `gorm:"PrimaryKey"`
	CandidateID uuid.UUID `gorm:"not null"`
}
