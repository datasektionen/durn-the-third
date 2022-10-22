package db

import (
	"database/sql"
	"time"

	uuid "github.com/satori/go.uuid"
)

type Election struct {
	ID          uuid.UUID    `gorm:"primaryKey"`
	Name        string       `gorm:"not null"`
	Description string       `gorm:"not null"`
	Published   bool         `gorm:"not null"`
	Finalized   bool         `gorm:"not null"`
	OpenTime    sql.NullTime ``
	CloseTime   sql.NullTime ``
	Candidates  []Candidate  `gorm:"foreignKey:ElectionID;references:ID"`
	Votes       []Vote       `json:"-"`
	Voters      []ValidVoter `gorm:"many2many:casted_votes"`
}

type ValidVoter struct {
	Email string `gorm:"primaryKey"`
}

type Candidate struct {
	ID           uuid.UUID `gorm:"primaryKey" json:"-"`
	Name         string    `gorm:"not null" json:"name"`
	Presentation string    `gorm:"not null" json:"presentation"`
	ElectionID   uuid.UUID `gorm:"not null"`
}

// type CastedVote struct {
// 	VoterID    string     `gorm:"primaryKey"`
// 	ElectionID uuid.UUID  `gorm:"primaryKey"`
// 	Voter      ValidVoter `gorm:"foreignKey:VoterID"`
// 	Election   Election   `gorm:"foreignKey:ElectionID"`
// }

// type VoteHash struct {
// 	Hash string `gorm:"primaryKey"`
// }

type Vote struct {
	Hash       string    `gorm:"primaryKey"`
	IsBlank    bool      `gorm:"not null"`
	VoteTime   time.Time `gorm:"not null"`
	ElectionID uuid.UUID `gorm:"not null"`
	Rankings   []Ranking `gorm:"foreignKey:VoteHash;references:Hash"`
}

type Ranking struct {
	VoteHash    string    `gorm:"PrimaryKey"`
	Rank        int       `gorm:"PrimaryKey"`
	CandidateID uuid.UUID `gorm:"not null"`
}
