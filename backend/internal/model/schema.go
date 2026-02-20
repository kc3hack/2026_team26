package model

import "time"

// This file contains canonical Go types for API requests/responses and DB records.
// Use these types across handlers, services and stores. Keep json/db tags
// synchronized with OpenAPI (`docs/swagger.yaml`).

type User struct {
	ID          string    `json:"id" db:"id"`
	Email       string    `json:"email" db:"email"`
	DisplayName string    `json:"display_name" db:"display_name"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type AuthResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token,omitempty"`
	RefreshToken string `json:"refresh_token,omitempty"`
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

// FatigueLog represents a persisted fatigue record
type FatigueLog struct {
	ID         string    `json:"id" db:"id"`
	UserID     string    `json:"user_id" db:"user_id"`
	GameID     *string   `json:"game_id,omitempty" db:"game_id"`
	FaceScore  int       `json:"face_score" db:"face_score"`
	VoiceScore int       `json:"voice_score" db:"voice_score"`
	RecordedAt time.Time `json:"recorded_at" db:"recorded_at"`
}

// Game represents a game record
type Game struct {
	ID      string `json:"id" db:"id"`
	Name    string `json:"name" db:"name"`
	Process string `json:"process" db:"process"`
}
