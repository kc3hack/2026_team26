package httpserver

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/team26/backend/internal/httpserver/auth"
	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/httpserver/fatigue"
	"github.com/team26/backend/internal/httpserver/update"
	"github.com/team26/backend/internal/service"
	"github.com/team26/backend/internal/ws"
)

func NewRouter(authService *service.AuthService, fatigueService *service.FatigueService, hub *ws.Hub) http.Handler {
	r := mux.NewRouter()
	r.HandleFunc("/fatigue", fatigue.MakeCreateFatigueHandler(fatigueService)).Methods("POST")
	r.HandleFunc("/fatigue", fatigue.MakeListFatigueHandler(fatigueService)).Methods("GET")
	r.HandleFunc("/ws/fatigue", common.MakeWSHandler(hub))
	r.HandleFunc("/auth/signup", auth.MakeSignupHandler(authService)).Methods("POST")
	r.HandleFunc("/auth/signin", auth.MakeSigninHandler(authService)).Methods("POST")
	r.HandleFunc("/auth/refresh", auth.MakeRefreshHandler(authService)).Methods("POST")
	r.HandleFunc("/auth/logout", auth.MakeLogoutHandler(authService)).Methods("POST")
	r.HandleFunc("/update", update.MakeCheckUpdateHandler()).Methods("GET")
	return r
}
