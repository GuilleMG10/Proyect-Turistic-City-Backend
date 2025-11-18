package repository

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"gorm.io/gorm"
)

type PlaceFavoriteRepository struct {
	db *gorm.DB
}

func NewPlaceFavoriteRepository(db *gorm.DB) *PlaceFavoriteRepository {
	return &PlaceFavoriteRepository{db: db}
}

// GetUserFavorites returns all active favorite places for a user
func (r *PlaceFavoriteRepository) GetUserFavorites(userID int) ([]model.PlaceFavorite, error) {
	var favorites []model.PlaceFavorite
	// Modificado: Añadido Preload("Place")
	if err := r.db.Preload("Place").Where("user_id = ? AND active = ?", userID, true).Find(&favorites).Error; err != nil {
		return nil, err
	}
	return favorites, nil
}

// FindFavorite checks if a favorite already exists
func (r *PlaceFavoriteRepository) FindFavorite(userID, placeID int) (*model.PlaceFavorite, error) {
	var favorite model.PlaceFavorite
	if err := r.db.Where("user_id = ? AND place_id = ?", userID, placeID).First(&favorite).Error; err != nil {
		return nil, err
	}
	return &favorite, nil
}

// CreateFavorite creates a new favorite
func (r *PlaceFavoriteRepository) CreateFavorite(favorite *model.PlaceFavorite) error {
	return r.db.Create(favorite).Error
}

// UpdateFavorite updates an existing favorite
func (r *PlaceFavoriteRepository) UpdateFavorite(favorite *model.PlaceFavorite) error {
	return r.db.Save(favorite).Error
}

// RemoveFavorite marks a favorite as inactive
func (r *PlaceFavoriteRepository) RemoveFavorite(userID, placeID int) error {
	result := r.db.Model(&model.PlaceFavorite{}).
		Where("user_id = ? AND place_id = ? AND active = ?", userID, placeID, true).
		Update("active", false)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}
