package model

import "time"

// This file contains canonical Go types for API requests/responses and DB records.
// Use these types across handlers, services and stores. Keep json/db tags
// synchronized with OpenAPI (`docs/swagger.yaml`).

// User represents a user account.
type User struct {
	ID          string    `json:"id" db:"id"`
	Email       string    `json:"email" db:"email"`
	DisplayName string    `json:"display_name" db:"display_name"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// SignupRequest is used for /auth/signup
type SignupRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required"`
	DisplayName string `json:"display_name,omitempty"`
}

// SigninRequest is used for /auth/signin
type SigninRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// AuthResponse contains user info (and optional token).
type AuthResponse struct {
	User  User   `json:"user"`
	AccessToken  string `json:"access_token,omitempty"`
	RefreshToken string `json:"refresh_token,omitempty"`
}

// RefreshRequest is used for /auth/refresh
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// RefreshTokenRecord represents the DB record for refresh tokens
type RefreshTokenRecord struct {
	ID         string     `json:"id" db:"id"`
	UserID     string     `json:"user_id" db:"user_id"`
	TokenHash  string     `json:"token_hash" db:"token_hash"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
	Revoked    bool       `json:"revoked" db:"revoked"`
	ClientInfo string     `json:"client_info,omitempty" db:"client_info"`
}

// LogoutRequest is used for /auth/logout
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// FatigueCreateRequest is the payload for POST /fatigue
type FatigueCreateRequest struct {
	UserID     string     `json:"user_id" db:"user_id" validate:"required,uuid"`
	GameID     string     `json:"game_id" db:"game_id" validate:"required,uuid"`
	FaceScore  int        `json:"face_score" db:"face_score" validate:"gte=0,lte=125"`
	VoiceScore int        `json:"voice_score" db:"voice_score" validate:"gte=0,lte=125"`
	RecordedAt *time.Time `json:"recorded_at,omitempty" db:"recorded_at"`
}

// FatigueCreateResponse is returned after creating a fatigue log
type FatigueCreateResponse struct {
	ID string `json:"id"`
}

// FatigueLog represents a persisted fatigue record
type FatigueLog struct {
	ID         string    `json:"id" db:"id"`
	UserID     string    `json:"user_id" db:"user_id"`
	GameID     string    `json:"game_id" db:"game_id"`
	FaceScore  int       `json:"face_score" db:"face_score"`
	VoiceScore int       `json:"voice_score" db:"voice_score"`
	RecordedAt time.Time `json:"recorded_at" db:"recorded_at"`
}
