package team

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/model/request"
	"github.com/team26/backend/internal/service"
)

func MakeCreateTeamHandler(svc *service.TeamService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req request.TeamCreate
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid payload")
			return
		}
		userID, _ := r.Context().Value(common.ContextUserIDKey).(string)
		if userID == "" {
			common.WriteErrorJSON(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		resp, err := svc.Create(&req, userID)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "could not create team")
			return
		}
		w.Header().Set("Content-Type", common.ContentTypeJSON)
		json.NewEncoder(w).Encode(resp)
	}
}
