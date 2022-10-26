package util

import (
	"database/sql"
	"net/mail"
	"time"
)

func ValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

// TimeIsInValidInterval checks if a given time lies if the given interval
// Returns false if the interval is not well defined, i.e. it has to have
// both a start and an end.
func TimeIsInValidInterval(time time.Time, start sql.NullTime, end sql.NullTime) bool {
	if !start.Valid || !end.Valid {
		return false
	}
	if time.Before(start.Time) || time.After(end.Time) {
		return false
	}
	return true
}
