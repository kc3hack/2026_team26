package auth

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/model/request"
	"github.com/team26/backend/internal/model/response"
	"github.com/team26/backend/internal/service"
)

func MakeSigninHandler(svc *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req request.Signin
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, common.InvalidPayload)
			return
		}
		authResp, refreshRaw, err := svc.Signin(&req)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		// Set HttpOnly access_token cookie (short-lived). In production set Secure=true.
		http.SetCookie(w, &http.Cookie{
			Name:     "access_token",
			Value:    authResp.AccessToken,
			HttpOnly: true,
			Path:     "/",
			// MaxAge omitted for access token; let token expiry control validity
			SameSite: http.SameSiteLaxMode,
			Secure:   false,
		})

		// attach refresh token in response for client
		out := struct {
			response.Signin
			RefreshToken string `json:"refresh_token,omitempty"`
		}{*authResp, refreshRaw}
		w.Header().Set("Content-Type", common.ContentTypeJSON)
		json.NewEncoder(w).Encode(out)
	}
}
