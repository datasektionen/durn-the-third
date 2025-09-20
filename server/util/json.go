package util

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/go-playground/validator"
)

var validate *validator.Validate = validator.New()

func GetFromUrl(url string, bearerToken string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return []byte{}, err
	}

	if bearerToken != nil {
		req.Header.Set("Authorization", "Bearer " + bearerToken)
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return []byte{}, err
	}
	defer res.Body.Close()

	ret, err := io.ReadAll(res.Body)
	if err != nil {
		return []byte{}, err
	}

	return ret, err
}

func ParseJson[D string | []byte, T any](data D, target *T) error {
	if err := json.Unmarshal([]byte(data), target); err != nil {
		return err
	}
	return nil
}

func GetJsonFromURL[T any](url string, target *T, bearerToken string) error {
	json, err := GetFromUrl(url, bearerToken)
	if err != nil {
		return err
	}

	if err := ParseJson(json, target); err != nil {
		return err
	}

	return nil
}

func ValidateJson[D string | []byte, T any](data D, target *T) error {
	if err := json.Unmarshal([]byte(data), target); err != nil {
		return err
	}

	if err := validate.Struct(target); err != nil {
		return err
	}

	return nil
}

func GetValidatedJsonFromURL[T any](url string, target *T, bearerToken string) error {
	json, err := GetFromUrl(url, bearerToken)
	if err != nil {
		return err
	}

	if err := ValidateJson(json, target); err != nil {
		return err
	}

	return nil
}

type NullTime struct {
	Time  time.Time
	Valid bool
}

var (
	NullStr []byte = []byte("null")
)

func (nullTime *NullTime) UnmarshalJSON(data []byte) (err error) {
	if bytes.Equal(data, NullStr) {
		nullTime.Valid = false
		return
	}

	var result time.Time
	err = json.Unmarshal(data, &result)
	nullTime.Time = result
	nullTime.Valid = true
	return
}

func (nullTime NullTime) MarshalJSON() ([]byte, error) {
	if !nullTime.Valid {
		return NullStr, nil
	}
	return json.Marshal(&nullTime.Time)
}

func ConvertNullTime(nullTime NullTime) sql.NullTime {
	return sql.NullTime{
		Time:  nullTime.Time,
		Valid: nullTime.Valid,
	}
}

func ConvertSqlNullTime(nullTime sql.NullTime) NullTime {
	return NullTime{
		Time:  nullTime.Time,
		Valid: nullTime.Valid,
	}
}
