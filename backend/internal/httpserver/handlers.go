package httpserver

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/team26/backend/internal/model"
	"github.com/team26/backend/internal/service"
	"github.com/team26/backend/internal/ws"
)

const (
    invalidPayload = "invalid payload"
    contentTypeJSON = "application/json"
)

func makeCreateFatigueHandler(svc *service.FatigueService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req model.FatigueCreateRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, invalidPayload, http.StatusBadRequest)
            return
        }
        if req.FaceScore < 0 || req.VoiceScore < 0 {
            http.Error(w, "scores must be >=0", http.StatusBadRequest)
            return
        }
        resp, err := svc.Create(&req)
        if err != nil {
            http.Error(w, "failed", http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", contentTypeJSON)
        json.NewEncoder(w).Encode(resp)
    }
}

func makeListFatigueHandler(svc *service.FatigueService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        q := r.URL.Query()
        uid := q.Get("u")
        from := q.Get("f")
        to := q.Get("t")
        if uid == "" || from == "" || to == "" {
            http.Error(w, "u,f,t required", http.StatusBadRequest)
            return
        }
        fromT, err := time.Parse(time.RFC3339, from)
        if err != nil {
            http.Error(w, "invalid from", http.StatusBadRequest)
            return
        }
        toT, err := time.Parse(time.RFC3339, to)
        if err != nil {
            http.Error(w, "invalid to", http.StatusBadRequest)
            return
        }
        list, err := svc.List(uid, fromT, toT)
        if err != nil {
            http.Error(w, "failed", http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", contentTypeJSON)
        json.NewEncoder(w).Encode(list)
    }
}

func makeWSHandler(h *ws.Hub) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        h.ServeWS(w, r)
    }
}

func makeSignupHandler(svc *service.AuthService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req model.SignupRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, invalidPayload, http.StatusBadRequest)
            return
        }
        resp, err := svc.Signup(&req)
        if err != nil {
            http.Error(w, "failed", http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", contentTypeJSON)
        json.NewEncoder(w).Encode(resp)
    }
}

func makeSigninHandler(svc *service.AuthService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req model.SigninRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, invalidPayload, http.StatusBadRequest)
            return
        }
        authResp, refreshRaw, err := svc.Signin(&req)
        if err != nil {
            http.Error(w, "unauthorized", http.StatusUnauthorized)
            return
        }
        // attach refresh token in response for client
        out := struct{
            model.AuthResponse
            RefreshToken string `json:"refresh_token,omitempty"`
        }{*authResp, refreshRaw}
        w.Header().Set("Content-Type", contentTypeJSON)
        json.NewEncoder(w).Encode(out)
    }
}
