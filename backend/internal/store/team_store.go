package store

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/team26/backend/internal/model"
)

type TeamStore struct{ DB *sql.DB }

func NewTeamStore(db *sql.DB) *TeamStore { return &TeamStore{DB: db} }

func (s *TeamStore) Create(teamName, ownerUuid string) (team *model.Team, err error) {
	id := uuid.New().String()
	now := time.Now()
	if err := s.existUser(ownerUuid); err != nil {
		return nil, err
	}
	tx, err := s.DB.Begin()
	if err != nil {
		return nil, err
	}
	if _, err := tx.Exec(`INSERT INTO teams (id,team_name,owner_id,created_at) VALUES ($1,$2,$3,$4)`, id, teamName, ownerUuid, now); err != nil {
		tx.Rollback()
		return nil, err
	}
	if _, err = tx.Exec(`INSERT INTO team_members (team_id,user_id,joined_at) VALUES ($1,$2,$3)`, id, ownerUuid, now); err != nil {
		tx.Rollback()
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	team = &model.Team{
		ID:        id,
		TeamName:  teamName,
		OwnerID:   ownerUuid,
		CreatedAt: now,
	}
	return team, nil
}

func (s *TeamStore) Join(teamId, userId string) (*model.Team, error) {
	now := time.Now()
	if _, err := s.GetByTeamID(teamId); err != nil {
		return nil, err
	}
	if err := s.existUser(userId); err != nil {
		return nil, err
	}
	if _, err := s.DB.Exec(`INSERT INTO team_members (team_id,user_id,joined_at) VALUES ($1,$2,$3)`, teamId, userId, now); err != nil {
		return nil, err
	}
	return s.GetByTeamID(teamId)
}

func (s *TeamStore) GetByTeamID(id string) (*model.Team, error) {
	var t model.Team
	err := s.DB.QueryRow(`SELECT id,team_name,owner_id,created_at FROM teams WHERE id=$1`, id).Scan(&t.ID, &t.TeamName, &t.OwnerID, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *TeamStore) existUser(id string) error {
	userStore := &UserStore{DB: s.DB}
	// ユーザーの存在確認
	if _, err := userStore.GetByID(id); err != nil {
		return sql.ErrNoRows
	}
	return nil
}

func (s *TeamStore) GetByTeamTag(teamTag string) (*model.Team, error) {
	var teamID string
	err := s.DB.QueryRow(`SELECT team_id FROM team_tags WHERE tag=$1 AND (limited_until IS NULL OR limited_until > NOW())`, teamTag).Scan(&teamID)
	if err != nil {
		return nil, err
	}
	return s.GetByTeamID(teamID)
}

func (s *TeamStore) Leave(teamId, userId string) error {
	if _, err := s.GetByTeamID(teamId); err != nil {
		return err
	}
	if err := s.existUser(userId); err != nil {
		return err
	}
	_, err := s.DB.Exec(`DELETE FROM team_members WHERE team_id=$1 AND user_id=$2`, teamId, userId)
	return err
}

func (s *TeamStore) ListMembers(teamId string) ([]string, error) {
	rows, err := s.DB.Query(`SELECT user_id FROM team_members WHERE team_id=$1`, teamId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var members []string
	for rows.Next() {
		var userId string
		if err := rows.Scan(&userId); err != nil {
			return nil, err
		}
		members = append(members, userId)
	}
	return members, nil
}
