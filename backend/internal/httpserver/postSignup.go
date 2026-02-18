package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/model"
	"github.com/team26/backend/internal/service"
)

func makeSignupHandler(svc *service.AuthService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req model.SignupRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            writeErrorJSON(w, http.StatusBadRequest, invalidPayload)
            return
        }
        resp, err := svc.Signup(&req)
        if err != nil {
            writeErrorJSON(w, http.StatusInternalServerError, "failed")
            return
        }
        w.Header().Set("Content-Type", contentTypeJSON)
        json.NewEncoder(w).Encode(resp)
    }
}
