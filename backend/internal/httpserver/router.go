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
	common.GET(r, "/fatigue", fatigue.MakeListFatigueHandler(fatigueService), authService)
	common.POST(r, "/fatigue", fatigue.MakeCreateFatigueHandler(fatigueService), authService)
	r.HandleFunc("/ws/fatigue", common.MakeWSHandler(hub))
	common.POST(r, "/auth/signup", auth.MakeSignupHandler(authService), nil)
	common.POST(r, "/auth/signin", auth.MakeSigninHandler(authService), nil)
	common.POST(r, "/auth/refresh", auth.MakeRefreshHandler(authService), nil)
	common.POST(r, "/auth/logout", auth.MakeLogoutHandler(authService), nil)
	common.GET(r, "/update", update.MakeCheckUpdateHandler(), nil)
	return r
}
