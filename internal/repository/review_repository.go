package repository

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"gorm.io/gorm"
)

type ReviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) *ReviewRepository {
	return &ReviewRepository{
		db: db,
	}
}

// Usamos Preload para cargar también la información del usuario asociado (el autor).
func (r *ReviewRepository) FindByPlaceID(placeID uint) ([]*model.Review, error) {
	var reviews []*model.Review
	if err := r.db.Preload("User").Where("place_id = ?", placeID).Find(&reviews).Error; err != nil {
		return nil, err
	}
	return reviews, nil
}
