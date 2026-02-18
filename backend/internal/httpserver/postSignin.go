package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/model"
	"github.com/team26/backend/internal/service"
)

func makeSigninHandler(svc *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req model.SigninRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorJSON(w, http.StatusBadRequest, invalidPayload)
			return
		}
		authResp, refreshRaw, err := svc.Signin(&req)
		if err != nil {
			writeErrorJSON(w, http.StatusUnauthorized, "unauthorized")
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
