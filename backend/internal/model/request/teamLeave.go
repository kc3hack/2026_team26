package request

type TeamLeave struct {
	TeamID string `json:"team_id" validate:"required"`
}
