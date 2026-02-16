package service

import (
	"database/sql"
	"time"

	"github.com/team26/backend/internal/model"
	"github.com/team26/backend/internal/store"
	"github.com/team26/backend/internal/ws"
)

type FatigueService struct{
    Store *store.FatigueStore
    Hub   *ws.Hub
}

func NewFatigueService(db *sql.DB, hub *ws.Hub) *FatigueService {
    return &FatigueService{Store: store.NewFatigueStore(db), Hub: hub}
}

func (s *FatigueService) Create(req *model.FatigueCreateRequest) (*model.FatigueCreateResponse, error) {
    f := &model.FatigueLog{
        ID:         "",
        UserID:     req.UserID,
        GameID:     req.GameID,
        FaceScore:  req.FaceScore,
        VoiceScore: req.VoiceScore,
    }
    if req.RecordedAt != nil {
        f.RecordedAt = *req.RecordedAt
    }
    if err := s.Store.Create(f); err != nil {
        return nil, err
    }
    // broadcast
    if s.Hub != nil {
        s.Hub.BroadcastAny(f)
    }
    return &model.FatigueCreateResponse{ID: f.ID}, nil
}

func (s *FatigueService) List(userID string, from, to time.Time) ([]model.FatigueLog, error) {
    return s.Store.ListByUserRange(userID, from, to)
}
