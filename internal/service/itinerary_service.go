package service

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/repository"
)

type ItineraryService struct {
	repo *repository.ItineraryRepository
}

func NewItineraryService(repo *repository.ItineraryRepository) *ItineraryService {
	return &ItineraryService{repo: repo}
}

// GetUserItineraries returns all itineraries for a user
func (s *ItineraryService) GetUserItineraries(userID uint) ([]model.Itinerary, error) {
	return s.repo.GetByUserID(userID)
}

// GetItinerary returns a single itinerary by ID
func (s *ItineraryService) GetItinerary(id uint) (*model.Itinerary, error) {
	return s.repo.GetByID(id)
}

// CreateItinerary creates a new itinerary
func (s *ItineraryService) CreateItinerary(itinerary *model.Itinerary) error {
	return s.repo.Create(itinerary)
}

// UpdateItinerary updates an existing itinerary
func (s *ItineraryService) UpdateItinerary(itinerary *model.Itinerary) error {
	return s.repo.Update(itinerary)
}

// DeleteItinerary removes an itinerary
func (s *ItineraryService) DeleteItinerary(id uint) error {
	return s.repo.Delete(id)
}

// AddItem adds an item to an itinerary
func (s *ItineraryService) AddItem(item *model.ItineraryItem) error {
	return s.repo.AddItem(item)
}

// UpdateItem updates an itinerary item
func (s *ItineraryService) UpdateItem(item *model.ItineraryItem) error {
	return s.repo.UpdateItem(item)
}

// DeleteItem removes an item from an itinerary
func (s *ItineraryService) DeleteItem(itemID uint) error {
	return s.repo.DeleteItem(itemID)
}

// ReplaceItems replaces all items in an itinerary
func (s *ItineraryService) ReplaceItems(itineraryID uint, items []model.ItineraryItem) error {
	return s.repo.ReplaceItems(itineraryID, items)
}
