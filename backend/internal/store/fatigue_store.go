package store

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/team26/backend/internal/model"
)

type FatigueStore struct{ DB *sql.DB }

func NewFatigueStore(db *sql.DB) *FatigueStore { return &FatigueStore{DB: db} }

func (s *FatigueStore) Create(f *model.FatigueLog) error {
    if f.ID == "" {
        f.ID = uuid.New().String()
    }
    if f.RecordedAt.IsZero() {
        f.RecordedAt = time.Now()
    }
    _, err := s.DB.Exec(`INSERT INTO fatigue_logs (id,user_id,game_id,face_score,voice_score,recorded_at) VALUES ($1,$2,$3,$4,$5,$6)`, f.ID, f.UserID, f.GameID, f.FaceScore, f.VoiceScore, f.RecordedAt)
    return err
}

func (s *FatigueStore) ListByUserRange(userID string, from, to time.Time) ([]model.FatigueLog, error) {
    rows, err := s.DB.Query(`SELECT id,user_id,game_id,face_score,voice_score,recorded_at FROM fatigue_logs WHERE user_id=$1 AND recorded_at >= $2 AND recorded_at <= $3 ORDER BY recorded_at ASC`, userID, from, to)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var list []model.FatigueLog
    for rows.Next() {
        var f model.FatigueLog
        if err := rows.Scan(&f.ID, &f.UserID, &f.GameID, &f.FaceScore, &f.VoiceScore, &f.RecordedAt); err != nil {
            return nil, err
        }
        list = append(list, f)
    }
    return list, nil
}
