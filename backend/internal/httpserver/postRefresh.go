package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/model"
	"github.com/team26/backend/internal/service"
)

func makeRefreshHandler(svc *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req model.RefreshRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorJSON(w, http.StatusBadRequest, invalidPayload)
			return
		}
		authResp, refreshRaw, err := svc.RefreshToken(req.RefreshToken)
		if err != nil {
			writeErrorJSON(w, http.StatusUnauthorized, "invalid refresh token")
			return
		}
		// attach refresh token in response for client
		out := struct {
			model.AuthResponse
			RefreshToken string `json:"refresh_token,omitempty"`
		}{*authResp, refreshRaw}
		w.Header().Set("Content-Type", contentTypeJSON)
		json.NewEncoder(w).Encode(out)
	}
}
