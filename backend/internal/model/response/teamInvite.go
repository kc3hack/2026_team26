package response

import "time"

type TeamInvite struct {
	InviteCode string     `json:"invite_code"`
	Limit      *time.Time `json:"limit,omitempty"` // ISO8601 format, optional
}
