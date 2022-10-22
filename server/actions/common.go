package actions

// All functions in this file should be passed a db as a parameter,
// in order to avoid deadlocks, since all functions that should
// call functions in this file should fetch the database connection
// themself

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func trySaveDatabaseRecord[T interface{}](c *gin.Context, db *gorm.DB, record T) bool {
	if err := db.Save(&record).Error; err != nil {
		fmt.Println(err)
		c.String(http.StatusInternalServerError, "500 Internal Server Error: Server failed to handle request")
		return false
	}
	return true
}
