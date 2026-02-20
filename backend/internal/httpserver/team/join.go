package team

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/model/request"
	"github.com/team26/backend/internal/service"
)

func MakeJoinTeamHandler(svc *service.TeamService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req request.TeamJoin
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid payload")
			return
		}
		userID, _ := r.Context().Value(common.ContextUserIDKey).(string)
		if userID == "" {
			common.WriteErrorJSON(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		teamId, err := svc.GetTeamIDFromCode(req.Tag)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid invite code")
			return
		}
		resp, err := svc.Join(teamId, userID)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
