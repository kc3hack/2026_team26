package auth

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/service"
)

func MakeGetMeHandler(authService *service.AuthService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, _ := r.Context().Value(common.ContextUserIDKey).(string)
		if userID == "" {
			common.WriteErrorJSON(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		resp, err := authService.GetMe(userID)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusInternalServerError, "failed to get user info")
			return
		}
		w.Header().Set("Content-Type", common.ContentTypeJSON)
		json.NewEncoder(w).Encode(resp)
	}
}
