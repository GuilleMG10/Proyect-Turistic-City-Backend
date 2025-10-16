package service

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
)

type PlaceFavoriteRepository interface {
	GetUserFavorites(userID int) ([]model.PlaceFavorite, error)
	FindFavorite(userID, placeID int) (*model.PlaceFavorite, error)
	CreateFavorite(favorite *model.PlaceFavorite) error
	UpdateFavorite(favorite *model.PlaceFavorite) error
	RemoveFavorite(userID, placeID int) error
}

type PlaceFavoriteService struct {
	placeFavoriteRepository PlaceFavoriteRepository
}

func NewPlaceFavoriteService(placeFavoriteRepository PlaceFavoriteRepository) *PlaceFavoriteService {
	return &PlaceFavoriteService{placeFavoriteRepository: placeFavoriteRepository}
}

// GetUserFavorites retrieves all active favorite places for a user
func (s *PlaceFavoriteService) GetUserFavorites(userID int) ([]model.PlaceFavorite, error) {
	return s.placeFavoriteRepository.GetUserFavorites(userID)
}

// AddFavorite adds or reactivates a favorite place
func (s *PlaceFavoriteService) AddFavorite(userID, placeID int) (*model.PlaceFavorite, error) {
	// Check if favorite already exists
	existing, err := s.placeFavoriteRepository.FindFavorite(userID, placeID)
	if err == nil && existing != nil {
		// Reactivate if exists
		existing.Active = true
		if err := s.placeFavoriteRepository.UpdateFavorite(existing); err != nil {
			return nil, err
		}
		return existing, nil
	}

	// Create new favorite
	favorite := &model.PlaceFavorite{
		UserID:  userID,
		PlaceID: placeID,
		Active:  true,
	}

	if err := s.placeFavoriteRepository.CreateFavorite(favorite); err != nil {
		return nil, err
	}

	return favorite, nil
}

// RemoveFavorite marks a favorite as inactive
func (s *PlaceFavoriteService) RemoveFavorite(userID, placeID int) error {
	return s.placeFavoriteRepository.RemoveFavorite(userID, placeID)
}
