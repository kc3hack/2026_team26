package request

import "time"

type TeamInvite struct {
	TeamID string     `json:"team_id"`
	Limit  *time.Time `json:"limit,omitempty"` // ISO8601 format, optional
}
