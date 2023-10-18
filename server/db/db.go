package db

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"durn/config"
)

var db *gorm.DB

func InitDB() {
	c := config.GetConfig()
	dsn := c.DATABASE_URL
	var err error
	if db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{}); err != nil {
		fmt.Println(err)
		os.Exit(5)
	}

	db.AutoMigrate(&Election{})
	db.AutoMigrate(&ValidVoter{})
	db.AutoMigrate(&Candidate{})
	db.AutoMigrate(&Vote{})
	db.AutoMigrate(&Ranking{})
	db.AutoMigrate(&CastedVote{})
	db.AutoMigrate(&VoteHash{})
}

func GetDB() *gorm.DB {
	return db
}

// ReorderRows shuffles the rows in the specified table
// O(N log N) ?
func ReorderRows(db *gorm.DB, table string) error {
	tmp := table + "_tmp"
	return db.Transaction(func(tx *gorm.DB) error {
		if err := db.Raw("CREATE TABLE ? SELECT * FROM ? ORDER BY RAND()", tmp, table).Error; err != nil {
			return err
		}
		if err := db.Raw("DELETE FROM ?", table).Error; err != nil {
			return err
		}
		if err := db.Raw("INSERT INTO ? SELECT * FROM ? ORDER BY RAND()", table, tmp).Error; err != nil {
			return err
		}
		if err := db.Raw("DROP TABLE ?", tmp).Error; err != nil {
			return err
		}
		return nil
	})
}
