package service

import "github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"

type UserInterestRepository interface {
	FindUserInterests(userID uint) ([]*model.UserInterest, error)
	CreateUserInterest(userID uint, eventID uint) (*model.UserInterest, error)
	DeactivateUserInterest(userID uint, eventID uint) error
}

type UserInterestService struct {
	userInterestRepository UserInterestRepository
}

func NewUserInterestService(userInterestRepository UserInterestRepository) *UserInterestService {
	return &UserInterestService{
		userInterestRepository: userInterestRepository,
	}
}

func (s *UserInterestService) GetUserInterests(userID uint) ([]*model.UserInterest, error) {
	return s.userInterestRepository.FindUserInterests(userID)
}

func (s *UserInterestService) AddUserInterest(userID uint, eventID uint) (*model.UserInterest, error) {
	return s.userInterestRepository.CreateUserInterest(userID, eventID)
}

func (s *UserInterestService) RemoveUserInterest(userID uint, eventID uint) error {
	return s.userInterestRepository.DeactivateUserInterest(userID, eventID)
}