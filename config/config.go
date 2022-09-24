package config

import (
	"fmt"
	"os"
	"strconv"

	_ "github.com/joho/godotenv/autoload"
)

var (
	loaded bool = false
	conf   Config
)

type Config struct {
	HOST      string
	PORT      int
	LOGIN_URL string
	LOGIN_KEY string
	PLS_URL   string
}

func loadStringEnv(v string, def string) string {
	val := os.Getenv(v)
	if val == "" {
		val = def
	}
	return def
}

func loadIntEnv(v string, def int) int {
	strVal := loadStringEnv(v, "")
	if strVal == "" {
		return def
	}
	val, err := strconv.Atoi(strVal)
	if err != nil {
		fmt.Println("FATAL")
		os.Exit(1)
	}
	return val
}

func GetConfig() *Config {
	if loaded {
		return &conf
	}

	conf = Config{
		HOST:      loadStringEnv("HOST", "localhost"),
		PORT:      loadIntEnv("PORT", 5000),
		LOGIN_URL: loadStringEnv("LOGIN_URL", "https://login.datasektionen.se"),
		LOGIN_KEY: loadStringEnv("LOGIN_KEY", ""),
		PLS_URL:   loadStringEnv("PLS_URL", "https://pls.datasektionen.se"),
	}

	loaded = true
	return &conf
}
