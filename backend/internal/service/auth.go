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

const (
	accessTokenInvalid = "invalid access token"
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

func (s *AuthService) RefreshToken(raw string) (*response.Refresh, error) {
	h := sha256.Sum256([]byte(raw))
	rtHash := hex.EncodeToString(h[:])
	id, userID, revoked, err := s.Refresh.FindByHash(rtHash)
	if err != nil || id == "" || revoked {
		return nil, errors.New("invalid refresh token")
	}
	u, err := s.Users.GetByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}
	// issue new access token
	claims := jwt.MapClaims{"sub": u.ID, "exp": time.Now().Add(15 * time.Minute).Unix()}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	at, err := token.SignedString(s.jwtKey)
	if err != nil {
		return nil, err
	}
	return &response.Refresh{RefreshToken: raw, AccessToken: at}, nil
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

// VerifyAccessToken validates a bearer access token and returns the subject user ID.
func (s *AuthService) VerifyAccessToken(raw string) (string, error) {
	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	claims := jwt.MapClaims{}
	_, err := parser.ParseWithClaims(raw, claims, func(t *jwt.Token) (any, error) {
		return s.jwtKey, nil
	})
	if err != nil {
		return "", errors.New(accessTokenInvalid)
	}

	expRaw, ok := claims["exp"].(float64)
	if !ok {
		return "", errors.New(accessTokenInvalid)
	}
	if time.Unix(int64(expRaw), 0).Before(time.Now()) {
		return "", errors.New("token expired")
	}

	sub, ok := claims["sub"].(string)
	if !ok || sub == "" {
		return "", errors.New(accessTokenInvalid)
	}

	return sub, nil
}
