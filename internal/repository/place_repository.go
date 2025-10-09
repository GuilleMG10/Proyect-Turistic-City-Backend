package repository

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"gorm.io/gorm"
)

type PlaceRepository struct {
	db *gorm.DB
}

func NewPlaceRepository(db *gorm.DB) *PlaceRepository {
	return &PlaceRepository{
		db: db,
	}
}

func (r *PlaceRepository) FindPlaces(query string) ([]*model.Place, error) {
	var places []*model.Place
	if err := r.db.Where("name LIKE ?", "%"+query+"%").Find(&places).Error; err != nil {
		return nil, err
	}
	return places, nil
}

func (r *PlaceRepository) CreatePlace(place *model.Place) error {
	return r.db.Create(place).Error
}

func (r *PlaceRepository) UpdatePlace(place *model.Place) error {
	return r.db.Save(place).Error
}

func (r *PlaceRepository) DeletePlace(id uint) error {
	return r.db.Delete(&model.Place{}, id).Error
}
