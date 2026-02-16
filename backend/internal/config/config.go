package config

import (
    "fmt"
    "os"
)

type Config struct {
    AppPort    string
    DBHost     string
    DBPort     string
    DBName     string
    DBUser     string
    DBPassword string
}

func LoadFromEnv() *Config {
    c := &Config{
        AppPort:    getenv("APP_PORT", "8080"),
        DBHost:     getenv("DB_HOST", "localhost"),
        DBPort:     getenv("DB_PORT", "5432"),
        DBName:     getenv("DB_NAME", "team26"),
        DBUser:     getenv("DB_USER", "team26"),
        DBPassword: getenv("DB_PASSWORD", "team26"),
    }
    return c
}

func (c *Config) BindAddr() string {
    return fmt.Sprintf(":"+c.AppPort)
}

func getenv(key, def string) string {
    v := os.Getenv(key)
    if v == "" {
        return def
    }
    return v
}
