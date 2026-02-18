package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/team26/backend/internal/model"
	"github.com/team26/backend/internal/service"
)

func isAllowingValues(value int) bool {
	if value < 0 {
		return false
	}
	if value > 125 {
		return false
	}
	return true
}

func makeCreateFatigueHandler(svc *service.FatigueService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req model.FatigueCreateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorJSON(w, http.StatusBadRequest, invalidPayload)
			return
		}
		if _, err := uuid.Parse(req.UserID); err != nil {
			writeErrorJSON(w, http.StatusBadRequest, "invalid user_id")
			return
		}
		// validate optional game_id if provided
		if req.GameID != nil {
			if _, err := uuid.Parse(*req.GameID); err != nil {
				writeErrorJSON(w, http.StatusBadRequest, "invalid game_id")
				return
			}
		}
		if !isAllowingValues(req.FaceScore) || !isAllowingValues(req.VoiceScore) {
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
