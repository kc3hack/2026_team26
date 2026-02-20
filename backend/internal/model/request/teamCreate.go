package request

type TeamCreate struct {
	Name string `json:"name" validate:"required"`
}
