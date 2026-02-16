package db

import (
	"database/sql"
	"os"
	"path/filepath"
)

// Migrate reads all files in ../migrations and executes them sequentially.
func Migrate(db *sql.DB) error {
    // simple single-file migration for now
    p := filepath.Join("migrations", "001_init.sql")
    b, err := os.ReadFile(p)
    if err != nil {
        return err
    }
    _, err = db.Exec(string(b))
    return err
}
