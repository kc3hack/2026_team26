package db

import (
	"database/sql"
	"net/url"

	_ "github.com/lib/pq"

	"github.com/team26/backend/internal/config"
)

func Connect(cfg *config.Config) (*sql.DB, error) {
    // build postgres DSN
    u := &url.URL{
        Scheme: "postgres",
        Host:   cfg.DBHost + ":" + cfg.DBPort,
        User:   url.UserPassword(cfg.DBUser, cfg.DBPassword),
        Path:   cfg.DBName,
    }
    // disable SSL if the server doesn't support it (or configure SSL on the server)
    q := u.Query()
    q.Set("sslmode", "disable")
    u.RawQuery = q.Encode()
    dsn := u.String()
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        return nil, err
    }
    if err := db.Ping(); err != nil {
        db.Close()
        return nil, err
    }
    return db, nil
}
