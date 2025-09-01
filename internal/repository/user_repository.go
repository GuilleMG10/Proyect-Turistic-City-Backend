package repository

import "github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"

type UserRepository struct {
}

// FindUserByID implements service.UserRepository.
func (u *UserRepository) FindUserByID(id int) (*model.User, error) {
	panic("unimplemented")
}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

func FindUserByID(id int) (*model.User, error) {
	return &model.User{
		ID:    1,
		Name:  "Pepito",
		Email: "Pepito@pepito.com",
	}, nil
}
