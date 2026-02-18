package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/model"
	"github.com/team26/backend/internal/service"
)

func makeLogoutHandler(svc *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req model.LogoutRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorJSON(w, http.StatusBadRequest, invalidPayload)
			return
		}
		if err := svc.Logout(req.RefreshToken); err != nil {
			writeErrorJSON(w, http.StatusUnauthorized, "invalid refresh token")
			return
		}
		w.Header().Set("Content-Type", contentTypeJSON)
		w.WriteHeader(http.StatusNoContent)
	}
}
