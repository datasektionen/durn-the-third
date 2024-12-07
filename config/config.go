package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
	// _ "github.com/joho/godotenv/autoload"
)

type Config struct {
	HOST            string
	PORT            int
	LOGIN_URL       string
	LOGIN_KEY       string
	PLS_URL         string
	PLS_SYSTEM_NAME string

	DATABASE_URL string
}

var (
	loaded bool = false
	conf   Config
)

func loadStringEnv(e string, def string) string {
	val, present := os.LookupEnv(e)
	if !present {
		fmt.Printf("No value found for ENV VAR '%s', using default value '%s'\n", e, def)
		val = def
	}
	return val
}

func loadIntEnv(e string, def int) int {
	strVal := loadStringEnv(e, strconv.Itoa(def))
	val, err := strconv.Atoi(strVal)
	if err != nil {
		fmt.Printf("FATAL: %s\n", err)
		os.Exit(1)
	}
	return val
}

func GetConfig() *Config {
	if loaded {
		return &conf
	}

	if err := godotenv.Load(".env"); err != nil {
		fmt.Println(err)
	}

	conf = Config{
		HOST:            loadStringEnv("HOST", "https://localhost.datasektionen.se"),
		PORT:            loadIntEnv("PORT", 3000),
		LOGIN_URL:       loadStringEnv("LOGIN_URL", "https://login.datasektionen.se"),
		LOGIN_KEY:       loadStringEnv("LOGIN_KEY", ""),
		PLS_URL:         loadStringEnv("PLS_URL", "https://pls.datasektionen.se"),
		PLS_SYSTEM_NAME: loadStringEnv("PLS_SYSTEM_NAME", "durn"),

		DATABASE_URL: loadStringEnv("DATABASE_URL", ""),
	}

	loaded = true
	return &conf
}
