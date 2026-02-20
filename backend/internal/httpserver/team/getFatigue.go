package team

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/model/response"
	"github.com/team26/backend/internal/service"
	"github.com/team26/backend/internal/utils"
)

func MakeListTeamFatigueHandler(svc *service.TeamService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		f := q.Get("f")
		t := q.Get("t")
		teamID := q.Get("team_id")

		userID, _ := r.Context().Value(common.ContextUserIDKey).(string)
		if userID == "" {
			common.WriteErrorJSON(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		err := svc.IsTeamMember(userID, teamID)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusForbidden, "forbidden")
			return
		}

		fromT, err := utils.StrToTime(f, time.Unix(0, 0).UTC())
		if err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid f: must be RFC3339 as string")
			return
		}

		toT, err := utils.StrToTime(t, time.Now().UTC())
		if err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid t: must be RFC3339 as string")
			return
		}

		var resp response.TeamFatigue

		resp.FatigueList, resp.TeamUser, resp.TeamData, err = svc.TeamFatigueList(teamID, fromT, toT)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusInternalServerError, err.Error())
			return
		}

		w.Header().Set("Content-Type", common.ContentTypeJSON)
		json.NewEncoder(w).Encode(resp)
	}
}
