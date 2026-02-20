package request

import "time"

type FatigueCreate struct {
	UserID     string     `json:"user_id" db:"user_id" validate:"required,uuid"`
	GameID     *string    `json:"game_id,omitempty" db:"game_id"`
	FaceScore  int        `json:"face_score" db:"face_score" validate:"gte=0,lte=125"`
	VoiceScore int        `json:"voice_score" db:"voice_score" validate:"gte=0,lte=125"`
	RecordedAt *time.Time `json:"recorded_at,omitempty" db:"recorded_at"`
}
