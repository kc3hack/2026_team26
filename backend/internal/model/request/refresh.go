package request

type Refresh struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}
