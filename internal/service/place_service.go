package service

import "github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"

type PlaceRepository interface {
	FindPlaces(query string) ([]*model.Place, error)
	CreatePlace(place *model.Place) error
}

type PlaceService struct {
	placeRepository PlaceRepository
}

func NewPlaceService(placeRepository PlaceRepository) *PlaceService {
	return &PlaceService{placeRepository: placeRepository}
}

func (s *PlaceService) GetPlaces(query string) ([]*model.Place, error) {
	// Add business logic
	return s.placeRepository.FindPlaces(query)
}

func (s *PlaceService) AddNewPlace(place *model.Place) error {
	// Add business logic
	return s.placeRepository.CreatePlace(place)
}
