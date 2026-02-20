package team

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/model/request"
	"github.com/team26/backend/internal/service"
)

func MakeLeaveTeamHandler(svc *service.TeamService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req request.TeamLeave
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid payload")
			return
		}
		userID, _ := r.Context().Value(common.ContextUserIDKey).(string)
		if userID == "" {
			common.WriteErrorJSON(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		if err := svc.Leave(req.TeamID, userID); err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "failed to leave team")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
