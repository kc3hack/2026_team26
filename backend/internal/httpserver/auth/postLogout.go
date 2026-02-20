package auth

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/model/request"
	"github.com/team26/backend/internal/service"
)

func MakeLogoutHandler(svc *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req request.Logout
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, common.InvalidPayload)
			return
		}
		if err := svc.Logout(req.RefreshToken); err != nil {
			common.WriteErrorJSON(w, http.StatusUnauthorized, "invalid refresh token")
			return
		}
		w.Header().Set("Content-Type", common.ContentTypeJSON)
		w.WriteHeader(http.StatusNoContent)
	}
}
