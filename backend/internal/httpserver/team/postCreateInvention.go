package team

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/model/request"
	"github.com/team26/backend/internal/model/response"
	"github.com/team26/backend/internal/service"
)

func MakeCreateInventionHandler(svc *service.TeamService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req request.TeamInvite
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid payload")
			return
		}
		userID, _ := r.Context().Value(common.ContextUserIDKey).(string)
		if userID == "" {
			common.WriteErrorJSON(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		err := svc.IsTeamMember(userID, req.TeamID)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusForbidden, "user is not a member of the team")
			return
		}
		code, limit, err := svc.CreateInvite(req.TeamID, req.Limit)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "could not create invite")
			return
		}
		w.Header().Set("Content-Type", common.ContentTypeJSON)
		json.NewEncoder(w).Encode(response.TeamInvite{InviteCode: code, Limit: limit})
	}
}
