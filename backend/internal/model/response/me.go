package response

import "github.com/team26/backend/internal/model"

type Me struct {
	UserData  model.User   `json:"user_data"`
	UserTeams []model.Team `json:"user_teams"`
}
