package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/model"
)

func makeCheckUpdateHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		version := "0.0.0"
		res := model.UpdateResponse{Current: version, Support: []string{"0.0.0", "0.0.1"}}
		w.Header().Set("Content-Type", contentTypeJSON)
		_ = json.NewEncoder(w).Encode(res)
	}
}
