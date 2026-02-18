package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/ws"
)

const (
	invalidPayload  = "invalid payload"
	contentTypeJSON = "application/json"
)

// writeErrorJSON writes a JSON error response with the given HTTP status
// and message in the shape { "errorMessage": "..." }.
func writeErrorJSON(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", contentTypeJSON)
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(struct {
		ErrorMessage string `json:"errorMessage"`
	}{ErrorMessage: msg})
}

func makeWSHandler(h *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h.ServeWS(w, r)
	}
}
