package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/team26/backend/internal/config"
	"github.com/team26/backend/internal/db"
	"github.com/team26/backend/internal/httpserver"
	"github.com/team26/backend/internal/service"
	"github.com/team26/backend/internal/ws"
)

func main() {
	ctx := context.Background()

	cfg := config.LoadFromEnv()

	dbConn, err := db.Connect(cfg)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer dbConn.Close()

	if err := db.Migrate(dbConn); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	hub := ws.NewHub()
	jwtKey := os.Getenv("JWT_KEY")
	if jwtKey == "" {
		jwtKey = "secret"
	}
	authSvc := service.NewAuthService(dbConn, []byte(jwtKey))
	fatigueSvc := service.NewFatigueService(dbConn, hub)
	teamSvc := service.NewTeamService(dbConn)
	router := httpserver.NewRouter(authSvc, fatigueSvc, teamSvc, hub)

	srv := &http.Server{
		Addr:         cfg.BindAddr(),
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("listening on %s", srv.Addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server: %v", err)
	}

	_ = ctx
	os.Exit(0)
}
