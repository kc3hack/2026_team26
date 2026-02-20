package store

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/team26/backend/internal/model"
)

type FatigueStore struct{ DB *sql.DB }

func NewFatigueStore(db *sql.DB) *FatigueStore { return &FatigueStore{DB: db} }

func isEmptyUUID(s string) bool {
	if s == "" {
		return true
	}
	if s == "00000000-0000-0000-0000-000000000000" {
		return true
	}
	return false
}

func (s *FatigueStore) Create(f *model.FatigueLog) error {
	if f.ID == "" {
		f.ID = uuid.New().String()
	}
	if f.RecordedAt.IsZero() {
		f.RecordedAt = time.Now()
	}
	var gid interface{}
	if f.GameID == nil || isEmptyUUID(*f.GameID) {
		gid = nil
	} else {
		gid = *f.GameID
	}
	_, err := s.DB.Exec(`INSERT INTO fatigue_logs (id,user_id,game_id,face_score,voice_score,recorded_at) VALUES ($1,$2,$3,$4,$5,$6)`, f.ID, f.UserID, gid, f.FaceScore, f.VoiceScore, f.RecordedAt)
	return err
}

func (s *FatigueStore) ListByUserRange(userID string, from, to time.Time, maxNum int) ([]model.FatigueLog, error) {
	rows, err := s.DB.Query(`SELECT id,user_id,game_id,face_score,voice_score,recorded_at FROM fatigue_logs WHERE user_id=$1 AND recorded_at >= $2 AND recorded_at <= $3 ORDER BY recorded_at DESC LIMIT $4`, userID, from, to, maxNum)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []model.FatigueLog
	for rows.Next() {
		var f model.FatigueLog
		var gid sql.NullString
		if err := rows.Scan(&f.ID, &f.UserID, &gid, &f.FaceScore, &f.VoiceScore, &f.RecordedAt); err != nil {
			return nil, err
		}
		if gid.Valid {
			s := gid.String
			f.GameID = &s
		} else {
			f.GameID = nil
		}
		list = append(list, f)
	}
	return list, nil
}
