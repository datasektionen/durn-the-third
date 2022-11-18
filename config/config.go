package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
	// _ "github.com/joho/godotenv/autoload"
)

type Config struct {
	HOST      string
	PORT      int
	LOGIN_URL string
	LOGIN_KEY string
	PLS_URL   string

	DATABASE_URL string

	DB_HOST string
	DB_PORT int
	DB_NAME string
	DB_USER string
	DB_PSWD string
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
		HOST:      loadStringEnv("HOST", "https://localhost.datasektionen.se"),
		PORT:      loadIntEnv("PORT", 3000),
		LOGIN_URL: loadStringEnv("LOGIN_URL", "https://login.datasektionen.se"),
		LOGIN_KEY: loadStringEnv("LOGIN_KEY", ""),
		PLS_URL:   loadStringEnv("PLS_URL", "https://pls.datasektionen.se"),

		DATABASE_URL: loadStringEnv("DATABASE_URL", ""),

		DB_HOST: loadStringEnv("DB_HOST", ""),
		DB_PORT: loadIntEnv("DB_PORT", 5432),
		DB_NAME: loadStringEnv("DB_NAME", "durn"),
		DB_USER: loadStringEnv("DB_USER", "durn"),
		DB_PSWD: loadStringEnv("DB_PSWD", ""),
	}

	loaded = true
	return &conf
}
