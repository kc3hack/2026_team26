package store

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/team26/backend/internal/model"
	"golang.org/x/crypto/bcrypt"
)

type UserStore struct{ DB *sql.DB }

func NewUserStore(db *sql.DB) *UserStore { return &UserStore{DB: db} }

func (s *UserStore) Create(email, password, displayName string) (*model.User, error) {
	id := uuid.New().String()
	now := time.Now()
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	_, err = s.DB.Exec(`INSERT INTO users (id,email,display_name,password_hash,created_at) VALUES ($1,$2,$3,$4,$5)`, id, email, displayName, string(hash), now)
	if err != nil {
		return nil, err
	}
	u := &model.User{ID: id, Email: email, DisplayName: displayName, CreatedAt: now}
	return u, nil
}

func (s *UserStore) GetByEmail(email string) (*model.User, string, error) {
	var u model.User
	var pwHash string
	err := s.DB.QueryRow(`SELECT id,email,display_name,password_hash,created_at FROM users WHERE email=$1`, email).Scan(&u.ID, &u.Email, &u.DisplayName, &pwHash, &u.CreatedAt)
	if err != nil {
		return nil, "", err
	}
	return &u, pwHash, nil
}

func (s *UserStore) GetByID(id string) (*model.User, error) {
	var u model.User
	err := s.DB.QueryRow(`SELECT id,email,display_name,created_at FROM users WHERE id=$1`, id).Scan(&u.ID, &u.Email, &u.DisplayName, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}
