package common

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/team26/backend/internal/service"
	"github.com/team26/backend/internal/ws"
)

const (
	InvalidPayload  = "invalid payload"
	ContentTypeJSON = "application/json"
)

type contextKey string

// ContextUserIDKey stores the subject user ID from a verified access token.
const ContextUserIDKey contextKey = "user_id"

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

// RequireBearerAuth validates Authorization: Bearer <token> and calls the next handler.
func RequireBearerAuth(authService *service.AuthService, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			WriteErrorJSON(w, http.StatusUnauthorized, "missing authorization header")
			return
		}

		const bearerPrefix = "Bearer "
		if !strings.HasPrefix(authHeader, bearerPrefix) {
			WriteErrorJSON(w, http.StatusUnauthorized, "invalid authorization header")
			return
		}

		rawToken := strings.TrimSpace(strings.TrimPrefix(authHeader, bearerPrefix))
		if rawToken == "" {
			WriteErrorJSON(w, http.StatusUnauthorized, "invalid authorization header")
			return
		}

		userID, err := authService.VerifyAccessToken(rawToken)
		if err != nil {
			WriteErrorJSON(w, http.StatusUnauthorized, "invalid access token")
			return
		}

		ctx := context.WithValue(r.Context(), ContextUserIDKey, userID)
		next(w, r.WithContext(ctx))
	}
}

func GET(r *mux.Router, path string, f http.HandlerFunc, authService *service.AuthService) *mux.Route {
	if authService == nil {
		return r.HandleFunc(path, f).Methods("GET")
	}
	return r.HandleFunc(path, RequireBearerAuth(authService, f)).Methods("GET")
}

func POST(r *mux.Router, path string, f http.HandlerFunc, authService *service.AuthService) *mux.Route {
	if authService == nil {
		return r.HandleFunc(path, f).Methods("POST")
	}
	return r.HandleFunc(path, RequireBearerAuth(authService, f)).Methods("POST")
}
