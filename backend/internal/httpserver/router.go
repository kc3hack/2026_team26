package httpserver

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/team26/backend/internal/service"
	"github.com/team26/backend/internal/ws"
)

// NewRouter builds the HTTP handler tree with injected services.
func NewRouter(auth *service.AuthService, fatigue *service.FatigueService, hub *ws.Hub) http.Handler {
    r := mux.NewRouter()
    r.HandleFunc("/fatigue", makeCreateFatigueHandler(fatigue)).Methods("POST")
    r.HandleFunc("/fatigue", makeListFatigueHandler(fatigue)).Methods("GET")
    r.HandleFunc("/ws/fatigue", makeWSHandler(hub))
    r.HandleFunc("/auth/signup", makeSignupHandler(auth)).Methods("POST")
    r.HandleFunc("/auth/signin", makeSigninHandler(auth)).Methods("POST")
		r.HandleFunc("/update", makeCheckUpdateHandler()).Methods("GET")
    return r
}
