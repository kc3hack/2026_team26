package service

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/team26/backend/internal/model"
	"github.com/team26/backend/internal/model/request"
	"github.com/team26/backend/internal/model/response"
	"github.com/team26/backend/internal/store"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	Users   *store.UserStore
	Refresh *store.RefreshStore
	jwtKey  []byte
}

func NewAuthService(db *sql.DB, jwtKey []byte) *AuthService {
	return &AuthService{Users: store.NewUserStore(db), Refresh: store.NewRefreshStore(db), jwtKey: jwtKey}
}

func (s *AuthService) Signup(req *request.Signup) (*response.Signup, error) {
	// create user
	u, err := s.Users.Create(req.Email, req.Password, req.DisplayName)
	if err != nil {
		return nil, err
	}
	return &response.Signup{AuthResponse: model.AuthResponse{User: *u}}, nil
}

func (s *AuthService) Signin(req *request.Signin) (*response.Signin, string, error) {
	u, pwHash, err := s.Users.GetByEmail(req.Email)
	if err != nil {
		return nil, "", err
	}
	if pwHash == "" {
		return nil, "", errors.New("no password set")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(pwHash), []byte(req.Password)); err != nil {
		return nil, "", errors.New("invalid credentials")
	}
	// create access token (short lived)
	claims := jwt.MapClaims{"sub": u.ID, "exp": time.Now().Add(15 * time.Minute).Unix()}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	at, err := token.SignedString(s.jwtKey)
	if err != nil {
		return nil, "", err
	}
	// create refresh token (random string hashed)
	rtRaw := jwt.NewNumericDate(time.Now()).String() + u.ID + time.Now().String()
	h := sha256.Sum256([]byte(rtRaw))
	rtHash := hex.EncodeToString(h[:])
	_, err = s.Refresh.Create(u.ID, rtHash, nil)
	if err != nil {
		return nil, "", err
	}
	return &response.Signin{AuthResponse: model.AuthResponse{User: *u, AccessToken: at}}, rtRaw, nil
}

func (s *AuthService) RefreshToken(raw string) (*response.Refresh, string, error) {
	h := sha256.Sum256([]byte(raw))
	rtHash := hex.EncodeToString(h[:])
	id, userID, revoked, err := s.Refresh.FindByHash(rtHash)
	if err != nil || id == "" || revoked {
		return nil, "", errors.New("invalid refresh token")
	}
	u, err := s.Users.GetByID(userID)
	if err != nil {
		return nil, "", err
	}
	// issue new access token
	claims := jwt.MapClaims{"sub": u.ID, "exp": time.Now().Add(15 * time.Minute).Unix()}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	at, err := token.SignedString(s.jwtKey)
	if err != nil {
		return nil, "", err
	}
	return &response.Refresh{RefreshToken: raw, AccessToken: at}, raw, nil
}

func (s *AuthService) Logout(raw string) error {
	h := sha256.Sum256([]byte(raw))
	rtHash := hex.EncodeToString(h[:])
	id, _, _, err := s.Refresh.FindByHash(rtHash)
	if err != nil || id == "" {
		return err
	}
	return s.Refresh.RevokeByID(id)
}
