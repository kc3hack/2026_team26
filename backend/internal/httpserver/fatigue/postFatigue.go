package fatigue

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/model/request"
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

func MakeCreateFatigueHandler(svc *service.FatigueService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req request.FatigueCreate
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, common.InvalidPayload)
			return
		}
		if _, err := uuid.Parse(req.UserID); err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid user_id")
			return
		}

		if req.GameID != nil {
			if _, err := uuid.Parse(*req.GameID); err != nil {
				common.WriteErrorJSON(w, http.StatusBadRequest, "invalid game_id")
				return
			}
		}
		if !isAllowingValues(req.FaceScore) || !isAllowingValues(req.VoiceScore) {
			common.WriteErrorJSON(w, http.StatusBadRequest, "scores must be between 0 and 125")
			return
		}
		resp, err := svc.Create(&req)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusInternalServerError, "failed")
			return
		}
		w.Header().Set("Content-Type", common.ContentTypeJSON)
		json.NewEncoder(w).Encode(resp)
	}
}
