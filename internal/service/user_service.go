package service

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"golang.org/x/crypto/bcrypt"
)

type UserRepository interface {
	FindUserByID(id int) (*model.User, error)
	FindUserByUsername(username string) (*model.User, error)
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

func (s *UserService) AddUser(user *model.User, rawPassword string) error {

	// aqui hace el hasheo automatico del password polsia
	hash, err := bcrypt.GenerateFromPassword([]byte(rawPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.PasswordHash = string(hash)
	user.RoleID = 4
	user.Active = true

	return s.userRepository.CreateUser(user)
}

func (s *UserService) Login(username, password string) (*model.User, error) {
	user, err := s.userRepository.FindUserByUsername(username)
	if err != nil {
		return nil, err
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return nil, err
	}

	return user, nil
}
