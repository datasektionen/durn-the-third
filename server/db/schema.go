package db

import (
	"database/sql"
	"fmt"
	"time"

	uuid "github.com/satori/go.uuid"
	"gorm.io/gorm"
)

type Election struct {
	ID            uuid.UUID      `gorm:"primaryKey" json:"id"`
	Name          string         `gorm:"not null" json:"name"`
	Description   string         `gorm:"not null;default:''" json:"description"`
	Published     bool           `gorm:"not null" json:"published"`
	Finalized     bool           `gorm:"not null" json:"finalized"`
	Mandates      int            `gorm:"not null;default:1" json:"mandates"`
	ExtraMandates int            `gorm:"not null;default:0" json:"extraMandates"`
	OpenTime      sql.NullTime   `json:"openTime"`
	CloseTime     sql.NullTime   `json:"closeTime"`
	Candidates    []Candidate    `gorm:"foreignKey:ElectionID;references:ID" json:"candidates"`
	Votes         []Vote         `json:"-"`
	Deleted       gorm.DeletedAt `json:"-"`
}

type ValidVoter struct {
	Email string `gorm:"primaryKey"`
}

type CastedVote struct {
	Email      string     `gorm:"primaryKey"`
	ElectionID uuid.UUID  `gorm:"primaryKey"`
	User       ValidVoter `gorm:"foreignKey:Email;references:Email"`
	Election   Election   `gorm:"foreignKey:ID;references:ElectionID"`
}

// All elections should contain two forces candidates "Vakant" and "Blank"
type Candidate struct {
	ID           uuid.UUID      `gorm:"primaryKey" json:"id"`
	Name         string         `gorm:"not null" json:"name"`
	Presentation string         `gorm:"not null" json:"presentation"`
	ElectionID   uuid.UUID      `gorm:"not null" json:"-"`
	Symbolic     bool           `gorm:"not null;default:false" json:"symbolic"`
	Election     Election       `json:"-"`
	Deleted      gorm.DeletedAt `json:"-"`
}

// VoteHash is purposefully not primaryKey/unique since it is theoretically
// possible for two hashes to be the same, albeit quite unlikely. If it was
// the case, however, it would prevent someone from voting, which is not good
type VoteHash struct {
	Hash       string    `gorm:"not null"`
	ElectionID uuid.UUID `gorm:"not null"`
}

type Vote struct {
	ID         uuid.UUID `gorm:"primaryKey"`
	VoteTime   time.Time `gorm:"not null"`
	ElectionID uuid.UUID `gorm:"not null"`
	Rankings   []Ranking `gorm:"foreignKey:VoteID;references:ID;constraint:OnDelete:CASCADE"`
	UserHash   string    ``
}

func (v *Vote) BeforeDelete(tx *gorm.DB) (err error) {
	fmt.Println(v.ID)
	tx.Delete(&Ranking{}, "vote_id", v.ID)
	return nil
}

type Ranking struct {
	VoteID      uuid.UUID `gorm:"PrimaryKey;constraint:OnDelete:CASCADE"`
	Rank        int       `gorm:"PrimaryKey"`
	CandidateID uuid.UUID `gorm:"not null"`
}

type ElectionResult struct {
	ID             uuid.UUID `gorm:"PrimaryKey"`
	ElectionID     uuid.UUID `gorm:"not null"`
	Election       Election  `gorm:"foreignKey:ElectionID"`
	CreationTime   time.Time `gorm:"not null"`
	CountingMethod string    `gorm:"not null"`
	Seed           int
	Results        []Result `gorm:"foreignKey:ElectionResultID;references:ID"`
}

type Result struct {
	ElectionResultID uuid.UUID `gorm:"PrimaryKey"`
	CandidateId      uuid.UUID `gorm:"PrimaryKey"`
	Candidate        Candidate `gorm:"foreignKey:CandidateId"`
	Ordering         int       `gorm:"not null"`
}
