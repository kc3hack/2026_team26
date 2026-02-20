package request

type TeamJoin struct {
	Tag string `json:"tag" validate:"required"`
}
