package common

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/ws"
)

const (
	InvalidPayload  = "invalid payload"
	ContentTypeJSON = "application/json"
)

// writeErrorJSON writes a JSON error response with the given HTTP status
// and message in the shape { "errorMessage": "..." }.
func WriteErrorJSON(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", ContentTypeJSON)
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(struct {
		ErrorMessage string `json:"errorMessage"`
	}{ErrorMessage: msg})
}

func MakeResponseJSONHandler(status int, payload any) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", ContentTypeJSON)
		w.WriteHeader(status)
		_ = json.NewEncoder(w).Encode(payload)
	}
}

func MakeWSHandler(h *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h.ServeWS(w, r)
	}
}
