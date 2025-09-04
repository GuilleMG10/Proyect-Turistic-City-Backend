package service

import "github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"

type UserRepository interface {
	FindUserByID(id int) (*model.User, error)
	CreateUser(user *model.User) error
}

type UserService struct {
	userRepository UserRepository
}

func NewUserService(userRepository UserRepository) *UserService {
	return &UserService{userRepository: userRepository}
}

func (s *UserService) GetUser(id int) (*model.User, error) {
	return s.userRepository.FindUserByID(id)
}

func (s *UserService) AddUser(user *model.User) error {
	return s.userRepository.CreateUser(user)
}
