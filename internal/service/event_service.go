package service

import "github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"

type EventRepository interface {
	FindAll() ([]*model.Event, error)
	FindByID(id uint) (*model.Event, error)
	Create(event *model.Event) error
	Update(event *model.Event) error
	Delete(id uint) error
}

type EventService struct {
	repo EventRepository
}

func NewEventService(repo EventRepository) *EventService {
	return &EventService{repo: repo}
}

func (s *EventService) GetAllEvents() ([]*model.Event, error) {
	return s.repo.FindAll()
}

func (s *EventService) GetEvent(id uint) (*model.Event, error) {
	return s.repo.FindByID(id)
}

func (s *EventService) AddEvent(event *model.Event) error {
	return s.repo.Create(event)
}

func (s *EventService) UpdateEvent(event *model.Event) error {
	return s.repo.Update(event)
}

func (s *EventService) DeleteEvent(id uint) error {
	return s.repo.Delete(id)
}
