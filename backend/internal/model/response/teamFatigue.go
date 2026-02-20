package response

import (
	"github.com/team26/backend/internal/model"
)

type TeamFatigue struct {
	TeamData    *model.Team                   `json:"team_data"`
	TeamUser    []*model.User                 `json:"team_user"`
	FatigueList map[string][]model.FatigueLog `json:"fatigue_list"`
}
