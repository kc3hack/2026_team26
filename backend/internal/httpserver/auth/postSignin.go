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
		// attach refresh token in response for client
		out := struct {
			response.Signin
			RefreshToken string `json:"refresh_token,omitempty"`
		}{*authResp, refreshRaw}
		w.Header().Set("Content-Type", common.ContentTypeJSON)
		json.NewEncoder(w).Encode(out)
	}
}
