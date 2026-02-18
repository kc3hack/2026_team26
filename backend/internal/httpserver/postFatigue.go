package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/model"
	"github.com/team26/backend/internal/service"
)

func makeCreateFatigueHandler(svc *service.FatigueService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req model.FatigueCreateRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            writeErrorJSON(w, http.StatusBadRequest, invalidPayload)
            return
        }
        if req.FaceScore < 0 || req.VoiceScore < 0 {
            writeErrorJSON(w, http.StatusBadRequest, "scores must be >=0")
            return
        }
        resp, err := svc.Create(&req)
        if err != nil {
            writeErrorJSON(w, http.StatusInternalServerError, "failed")
            return
        }
        w.Header().Set("Content-Type", contentTypeJSON)
        json.NewEncoder(w).Encode(resp)
    }
}
