package service

import (
	"log"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
)

type PlaceRepository interface {
	FindPlaces(query string) ([]*model.Place, error)
	CreatePlace(place *model.Place) error
	UpdatePlace(place *model.Place) error
	DeletePlace(id uint) error
}

type PlaceService struct {
	placeRepository PlaceRepository
	aiSync          *AISyncService
}

func NewPlaceService(placeRepository PlaceRepository) *PlaceService {
	return &PlaceService{
		placeRepository: placeRepository,
		aiSync:          NewAISyncService(),
	}
}

func (s *PlaceService) GetPlaces(query string) ([]*model.Place, error) {
	return s.placeRepository.FindPlaces(query)
}

func (s *PlaceService) AddNewPlace(place *model.Place) error {
	if err := s.placeRepository.CreatePlace(place); err != nil {
		return err
	}
	// Sync to AI backend (non-blocking, errors are logged but not returned)
	if err := s.aiSync.SyncPlaceToAI(place); err != nil {
		log.Printf("Failed to sync place to AI: %v", err)
	}
	return nil
}

func (s *PlaceService) UpdateExistingPlace(place *model.Place) error {
	if err := s.placeRepository.UpdatePlace(place); err != nil {
		return err
	}
	// Sync updated place to AI backend
	if err := s.aiSync.SyncPlaceToAI(place); err != nil {
		log.Printf("Failed to sync place to AI: %v", err)
	}
	return nil
}

func (s *PlaceService) DeleteExistingPlace(id uint) error {
	// TODO: Check if place has active favorites or reviews before deletion
	// For now, database CASCADE will handle related records
	return s.placeRepository.DeletePlace(id)
}
