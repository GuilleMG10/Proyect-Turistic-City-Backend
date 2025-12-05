package repository

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"gorm.io/gorm"
)

type UserPreferenceRepository struct {
	db *gorm.DB
}

func NewUserPreferenceRepository(db *gorm.DB) *UserPreferenceRepository {
	return &UserPreferenceRepository{db: db}
}

// GetByUserID returns all active preferences for a user
func (r *UserPreferenceRepository) GetByUserID(userID uint) ([]model.UserPreference, error) {
	var preferences []model.UserPreference
	err := r.db.Where("user_id = ? AND active = ?", userID, true).Find(&preferences).Error
	return preferences, err
}

// SaveCategories replaces all user preferences with new categories
// Uses a transaction to ensure atomicity
func (r *UserPreferenceRepository) SaveCategories(userID uint, categories []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Soft delete: mark all existing preferences as inactive
		if err := tx.Model(&model.UserPreference{}).
			Where("user_id = ?", userID).
			Update("active", false).Error; err != nil {
			return err
		}

		// Insert or update each category
		for _, category := range categories {
			var existing model.UserPreference
			err := tx.Where("user_id = ? AND category = ?", userID, category).First(&existing).Error

			if err == gorm.ErrRecordNotFound {
				// Create new preference
				newPref := model.UserPreference{
					UserID:   userID,
					Category: category,
					Active:   true,
				}
				if err := tx.Create(&newPref).Error; err != nil {
					return err
				}
			} else if err != nil {
				return err
			} else {
				// Reactivate existing preference
				if err := tx.Model(&existing).Update("active", true).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// DeleteByCategory removes a specific category preference for a user
func (r *UserPreferenceRepository) DeleteByCategory(userID uint, category string) error {
	return r.db.Model(&model.UserPreference{}).
		Where("user_id = ? AND category = ?", userID, category).
		Update("active", false).Error
}

// GetCategories returns just the category names for a user
func (r *UserPreferenceRepository) GetCategories(userID uint) ([]string, error) {
	var categories []string
	err := r.db.Model(&model.UserPreference{}).
		Where("user_id = ? AND active = ?", userID, true).
		Pluck("category", &categories).Error
	return categories, err
}
