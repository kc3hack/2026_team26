package service

import (
	"database/sql"
	"errors"
	"time"

	"github.com/team26/backend/internal/model"
	"github.com/team26/backend/internal/model/request"
	"github.com/team26/backend/internal/model/response"
	"github.com/team26/backend/internal/store"
)

var (
	ErrNotTeamMember = errors.New("user is not a member of this team")
)

type TeamService struct {
	Store *store.TeamStore
}

func NewTeamService(db *sql.DB) *TeamService {
	return &TeamService{Store: store.NewTeamStore(db)}
}

func (s *TeamService) Create(req *request.TeamCreate, ownerId string) (*response.TeamCreate, error) {
	t := &model.Team{
		TeamName: req.Name,
		OwnerID:  ownerId,
	}
	created, err := s.Store.Create(t.TeamName, t.OwnerID)
	if err != nil {
		return nil, err
	}
	return &response.TeamCreate{Team: *created}, nil
}

func (s *TeamService) GetTeamIDFromCode(teamTag string) (string, error) {
	t, err := s.Store.GetByTeamTag(teamTag)
	if err != nil {
		return "", err
	}
	return t.ID, nil
}

func (s *TeamService) Join(teamId, userId string) (*response.TeamJoin, error) {
	joined, err := s.Store.Join(teamId, userId)
	if err != nil {
		return nil, err
	}
	return &response.TeamJoin{Team: *joined}, nil
}

func (s *TeamService) Leave(teamId, userId string) error {
	if err := s.Store.Leave(teamId, userId); err != nil {
		return err
	}
	return nil
}

func (s *TeamService) GetMembers(teamId string) ([]string, error) {
	return s.Store.ListMembers(teamId)
}

func (s *TeamService) IsTeamMember(userId, teamId string) error {
	members, err := s.GetMembers(teamId)
	if err != nil {
		return err
	}
	for _, member := range members {
		if member == userId {
			return nil
		}
	}
	return ErrNotTeamMember
}

func (s *TeamService) TeamFatigueList(teamId string, from, to time.Time) (map[string][]model.FatigueLog, []*model.User, *model.Team, error) {
	list := make(map[string][]model.FatigueLog)
	fatigueStore := &store.FatigueStore{DB: s.Store.DB}
	userStore := &store.UserStore{DB: s.Store.DB}
	if to.Before(from) {
		return nil, nil, nil, errors.New("invalid time range: to must be after from")
	}
	maxNum := int(to.Sub(from).Minutes())
	var users []*model.User

	members, err := s.GetMembers(teamId)
	if err != nil {
		return nil, nil, nil, err
	}

	team, err := s.Store.GetByTeamID(teamId)
	if err != nil {
		return nil, nil, nil, err
	}

	for _, member := range members {
		logs, err := fatigueStore.ListByUserRange(member, from, to, maxNum)
		if err != nil {
			return nil, nil, nil, err
		}
		list[member] = logs
		user, err := userStore.GetByID(member)
		if err != nil {
			return nil, nil, nil, err
		}
		users = append(users, user)
	}
	return list, users, team, nil
}

func (s *TeamService) CreateInvite(teamId string, limit *time.Time) (string, *time.Time, error) {
	return s.Store.CreateInvite(teamId, limit)
}

func (s *TeamService) GetTeamByUserID(userID string) ([]model.Team, error) {
	team, err := s.Store.GetTeamByUserID(userID)
	if err != nil {
		return nil, err
	}
	return team, nil
}
