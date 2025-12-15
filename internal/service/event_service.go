package service

import (
	"log"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
)

type EventRepository interface {
	FindAll() ([]*model.Event, error)
	FindByID(id uint) (*model.Event, error)
	Create(event *model.Event) error
	Update(event *model.Event) error
	Delete(id uint) error
}

type EventService struct {
	repo   EventRepository
	aiSync *AISyncService
}

func NewEventService(repo EventRepository) *EventService {
	return &EventService{
		repo:   repo,
		aiSync: NewAISyncService(),
	}
}

func (s *EventService) GetAllEvents() ([]*model.Event, error) {
	return s.repo.FindAll()
}

func (s *EventService) GetEvent(id uint) (*model.Event, error) {
	return s.repo.FindByID(id)
}

func (s *EventService) AddEvent(event *model.Event) error {
	if err := s.repo.Create(event); err != nil {
		return err
	}
	// Sync to AI backend (non-blocking, errors are logged but not returned)
	if err := s.aiSync.SyncEventToAI(event); err != nil {
		log.Printf("Failed to sync event to AI: %v", err)
	}
	return nil
}

func (s *EventService) UpdateEvent(event *model.Event) error {
	if err := s.repo.Update(event); err != nil {
		return err
	}
	// Sync updated event to AI backend
	if err := s.aiSync.SyncEventToAI(event); err != nil {
		log.Printf("Failed to sync event to AI: %v", err)
	}
	return nil
}

func (s *EventService) DeleteEvent(id uint) error {
	return s.repo.Delete(id)
}
