package auth

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/model/request"
	"github.com/team26/backend/internal/model/response"
	"github.com/team26/backend/internal/service"
)

func MakeRefreshHandler(svc *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req request.Refresh
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, common.InvalidPayload)
			return
		}
		authResp, err := svc.RefreshToken(req.RefreshToken)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusUnauthorized, "invalid refresh token")
			return
		}
		// attach refresh token in response for client
		out := struct {
			*response.Refresh
			RefreshToken string `json:"refresh_token,omitempty"`
		}{authResp, authResp.RefreshToken}
		w.Header().Set("Content-Type", common.ContentTypeJSON)
		json.NewEncoder(w).Encode(out)
	}
}
