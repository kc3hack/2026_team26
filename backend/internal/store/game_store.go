package store

import (
	"database/sql"

	"github.com/team26/backend/internal/model"
)

type GameStore struct{ DB *sql.DB }

func NewGameStore(db *sql.DB) *GameStore { return &GameStore{DB: db} }

func (s *GameStore) GetByID(id string) (*model.Game, error) {
    var g model.Game
    err := s.DB.QueryRow(`SELECT id,name,process FROM games WHERE id=$1`, id).Scan(&g.ID, &g.Name, &g.Process)
    if err != nil {
        return nil, err
    }
    return &g, nil
}
