package service

import "github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"

type UserRepository interface {
	FindUserByID(id int) (*model.User, error)
}
type UserService struct {
	userRepository UserRepository
}

func NewUserService(userRepository UserRepository) *UserService {
	return &UserService{
		userRepository: userRepository,
	}
}

func (s *UserService) GetUser(id int) (*model.User, error) {
	return &model.User{
		ID:    1,
		Name:  "Pepito",
		Email: "Pepito@pepito.com",
	}, nil
}
