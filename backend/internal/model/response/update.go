package response

type Update struct {
	Current string   `json:"current" db:"current"`
	Support []string `json:"support" db:"support"`
}
