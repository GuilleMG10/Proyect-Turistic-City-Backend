package repository

import (
	"time"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"gorm.io/gorm"
)

type UserInterestRepository struct {
	db *gorm.DB
}

func NewUserInterestRepository(db *gorm.DB) *UserInterestRepository {
	return &UserInterestRepository{
		db: db,
	}
}

func (r *UserInterestRepository) FindUserInterests(userID uint) ([]*model.UserInterest, error) {
	var interests []*model.UserInterest
	if err := r.db.Where("user_id = ? AND active = ?", userID, true).Find(&interests).Error; err != nil {
		return nil, err
	}
	return interests, nil
}

func (r *UserInterestRepository) CreateUserInterest(userID uint, eventID uint) (*model.UserInterest, error) {
	var existingInterest model.UserInterest
	err := r.db.Where("user_id = ? AND event_id = ?", userID, eventID).First(&existingInterest).Error

	if err == nil {
		if !existingInterest.Active {
			existingInterest.Active = true
			if err := r.db.Save(&existingInterest).Error; err != nil {
				return nil, err
			}
			return &existingInterest, nil
		}
		return &existingInterest, nil
	}

	if err == gorm.ErrRecordNotFound {
		interest := &model.UserInterest{
			UserID:    userID,
			EventID:   eventID,
			Active:    true,
			CreatedAt: time.Now(),
		}

		if err := r.db.Create(interest).Error; err != nil {
			return nil, err
		}

		return interest, nil
	}

	return nil, err
}

func (r *UserInterestRepository) DeactivateUserInterest(userID uint, eventID uint) error {
	result := r.db.Model(&model.UserInterest{}).
		Where("user_id = ? AND event_id = ? AND active = ?", userID, eventID, true).
		Update("active", false)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}
