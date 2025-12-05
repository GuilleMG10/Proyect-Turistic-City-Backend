package service

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/repository"
)

type UserPreferenceService struct {
	repo *repository.UserPreferenceRepository
}

func NewUserPreferenceService(repo *repository.UserPreferenceRepository) *UserPreferenceService {
	return &UserPreferenceService{repo: repo}
}

// GetUserPreferences returns all active preferences for a user
func (s *UserPreferenceService) GetUserPreferences(userID uint) ([]model.UserPreference, error) {
	return s.repo.GetByUserID(userID)
}

// SaveUserPreferences replaces all preferences with new categories
func (s *UserPreferenceService) SaveUserPreferences(userID uint, categories []string) error {
	return s.repo.SaveCategories(userID, categories)
}

// DeletePreference removes a specific category preference
func (s *UserPreferenceService) DeletePreference(userID uint, category string) error {
	return s.repo.DeleteByCategory(userID, category)
}

// GetUserCategories returns just the category names for a user
func (s *UserPreferenceService) GetUserCategories(userID uint) ([]string, error) {
	return s.repo.GetCategories(userID)
}
