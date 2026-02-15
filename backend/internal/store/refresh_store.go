package store

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type RefreshStore struct{ DB *sql.DB }

func NewRefreshStore(db *sql.DB) *RefreshStore { return &RefreshStore{DB: db} }

func (s *RefreshStore) Create(userID, tokenHash string, expiresAt *time.Time) (string, error) {
    id := uuid.New().String()
    now := time.Now()
    _, err := s.DB.Exec(`INSERT INTO refresh_tokens (id,user_id,token_hash,expires_at,created_at,revoked) VALUES ($1,$2,$3,$4,$5,$6)`, id, userID, tokenHash, expiresAt, now, false)
    if err != nil {
        return "", err
    }
    return id, nil
}

func (s *RefreshStore) RevokeByID(id string) error {
    _, err := s.DB.Exec(`UPDATE refresh_tokens SET revoked=true WHERE id=$1`, id)
    return err
}

func (s *RefreshStore) FindByHash(tokenHash string) (string, string, bool, error) {
    var id, userID string
    var revoked bool
    err := s.DB.QueryRow(`SELECT id,user_id,revoked FROM refresh_tokens WHERE token_hash=$1 LIMIT 1`, tokenHash).Scan(&id, &userID, &revoked)
    if err != nil {
        if err == sql.ErrNoRows {
            return "", "", false, nil
        }
        return "", "", false, err
    }
    return id, userID, revoked, nil
}
