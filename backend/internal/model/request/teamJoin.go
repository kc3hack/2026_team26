package request

type TeamJoin struct {
	Tag string `json:"team_tag" validate:"required"`
}
