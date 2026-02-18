package httpserver

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/team26/backend/internal/service"
)

func makeListFatigueHandler(svc *service.FatigueService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        q := r.URL.Query()
        uid := q.Get("u")
        from := q.Get("f")
        to := q.Get("t")
        if uid == "" || from == "" || to == "" {
            writeErrorJSON(w, http.StatusBadRequest, "u,f,t required")
            return
        }
        fromT, err := time.Parse(time.RFC3339, from)
        if err != nil {
            writeErrorJSON(w, http.StatusBadRequest, "invalid from")
            return
        }
        toT, err := time.Parse(time.RFC3339, to)
        if err != nil {
            writeErrorJSON(w, http.StatusBadRequest, "invalid to")
            return
        }
        list, err := svc.List(uid, fromT, toT)
        if err != nil {
            writeErrorJSON(w, http.StatusInternalServerError, "failed")
            return
        }
        w.Header().Set("Content-Type", contentTypeJSON)
        json.NewEncoder(w).Encode(list)
    }
}
