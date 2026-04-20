package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
	// _ "github.com/joho/godotenv/autoload"
)

type Config struct {
	HOST   string
	DOMAIN string
	PORT   int

	OIDC_PROVIDER      string
	OIDC_CLIENT_ID     string
	OIDC_CLIENT_SECRET string
	OIDC_REDIRECT_URL  string

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
		HOST: loadStringEnv("HOST", "https://localhost.datasektionen.se"),
		DOMAIN: loadStringEnv("DOMAIN", "durn.datasektionen.se"),
		PORT: loadIntEnv("PORT", 3000),

		OIDC_PROVIDER:      loadStringEnv("OIDC_PROVIDER", "https://sso.datasektionen.se/op"),
		OIDC_CLIENT_ID:     loadStringEnv("OIDC_CLIENT_ID", "durn"),
		OIDC_CLIENT_SECRET: loadStringEnv("OIDC_CLIENT_SECRET", ""),
		OIDC_REDIRECT_URL:  loadStringEnv("OIDC_REDIRECT_URL", "https://durn.datasektionen.se/api/oidc/callback"),

		DATABASE_URL: loadStringEnv("DATABASE_URL", ""),
	}

	loaded = true
	return &conf
}
