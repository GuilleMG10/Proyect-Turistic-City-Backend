package repository

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindUserByID(id int) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindUserByUsername(username string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) CreateUser(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindInterestsByUserID(userID uint) ([]*model.Event, error) {
	var interests []*model.UserInterest

	// Eager-load the associated Event data for each interest found
	err := r.db.Preload("Event").Where("user_id = ? AND active = ?", userID, true).Find(&interests).Error
	if err != nil {
		return nil, err
	}

	// Extract the Event objects from the interest records
	var events []*model.Event
	for _, interest := range interests {
		// Ensure the preloaded event is valid before appending
		if interest.Event.ID != 0 {
			events = append(events, &interest.Event)
		}
	}

	return events, nil
}
