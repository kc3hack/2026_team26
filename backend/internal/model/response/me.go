package response

import "github.com/team26/backend/internal/model"

type Me struct {
	UserData  model.User
	UserTeams []model.Team
}
