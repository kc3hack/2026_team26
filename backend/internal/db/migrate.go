package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"
)

// Migrate reads all files in ../migrations and executes them sequentially.
func Migrate(db *sql.DB) error {
	// ensure migrations table exists
	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version text PRIMARY KEY,
		applied_at timestamptz NOT NULL
	)`); err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	// execute all files matching migrations/NNN_*.sql in sorted order
	pattern := filepath.Join("migrations", "[0-9][0-9][0-9]_*.sql")
	files, err := filepath.Glob(pattern)
	if err != nil {
		return err
	}
	if len(files) == 0 {
		return nil
	}
	sort.Strings(files)
	for _, p := range files {
		if err := applyMigration(db, p); err != nil {
			return err
		}
	}
	return nil
}

// applyMigration executes a single migration file if not already applied.
func applyMigration(db *sql.DB, p string) error {
	version := filepath.Base(p)

	// skip already applied
	var got string
	err := db.QueryRow("SELECT version FROM schema_migrations WHERE version=$1", version).Scan(&got)
	if err == nil {
		// already applied
		return nil
	}
	if err != sql.ErrNoRows {
		return fmt.Errorf("check migration %s: %w", version, err)
	}

	b, err := os.ReadFile(p)
	if err != nil {
		return fmt.Errorf("read migration %s: %w", p, err)
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("begin migration %s: %w", version, err)
	}
	if _, err := tx.Exec(string(b)); err != nil {
		tx.Rollback()
		return fmt.Errorf("exec migration %s: %w", p, err)
	}
	if _, err := tx.Exec("INSERT INTO schema_migrations(version, applied_at) VALUES($1,$2)", version, time.Now().UTC()); err != nil {
		tx.Rollback()
		return fmt.Errorf("record migration %s: %w", version, err)
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit migration %s: %w", version, err)
	}
	return nil
}
