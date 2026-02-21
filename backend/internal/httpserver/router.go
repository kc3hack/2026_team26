package httpserver

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/team26/backend/internal/httpserver/auth"
	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/httpserver/fatigue"
	"github.com/team26/backend/internal/httpserver/team"
	"github.com/team26/backend/internal/httpserver/update"
	"github.com/team26/backend/internal/service"
	"github.com/team26/backend/internal/ws"
)

func NewRouter(authService *service.AuthService, fatigueService *service.FatigueService, teamService *service.TeamService, hub *ws.Hub) http.Handler {
	r := mux.NewRouter()
	common.GET(r, "/fatigue", fatigue.MakeListFatigueHandler(fatigueService), authService)
	common.POST(r, "/fatigue", fatigue.MakeCreateFatigueHandler(fatigueService), authService)
	r.HandleFunc("/ws/fatigue", common.MakeWSHandler(hub))
	common.POST(r, "/auth/signup", auth.MakeSignupHandler(authService), nil)
	common.POST(r, "/auth/signin", auth.MakeSigninHandler(authService), nil)
	common.POST(r, "/auth/refresh", auth.MakeRefreshHandler(authService), nil)
	common.POST(r, "/auth/logout", auth.MakeLogoutHandler(authService), nil)
	common.GET(r, "/update", update.MakeCheckUpdateHandler(), nil)
	common.POST(r, "/team/create", team.MakeCreateTeamHandler(teamService), authService)
	common.POST(r, "/team/join", team.MakeJoinTeamHandler(teamService), authService)
	common.POST(r, "/team/leave", team.MakeLeaveTeamHandler(teamService), authService)
	common.POST(r, "/team/invite", team.MakeCreateInviteHandler(teamService), authService)
	common.GET(r, "/team/fatigue", team.MakeListTeamFatigueHandler(teamService), authService)
	common.GET(r, "/me", auth.MakeGetMeHandler(authService), authService)
	// Simple CORS middleware: echo Origin and allow credentials.
	// In production, replace with a stricter allowlist.
	corsWrapped := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		origin := req.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With")
		}

		// Handle preflight
		if req.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		r.ServeHTTP(w, req)
	})

	return corsWrapped
}
