package auth

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/model/request"
	"github.com/team26/backend/internal/service"
)

func MakeSignupHandler(svc *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req request.Signup
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, common.InvalidPayload)
			return
		}
		resp, err := svc.Signup(&req)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusInternalServerError, "failed")
			return
		}
		w.Header().Set("Content-Type", common.ContentTypeJSON)
		json.NewEncoder(w).Encode(resp)
	}
}
