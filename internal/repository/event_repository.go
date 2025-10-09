package repository

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"gorm.io/gorm"
)

type EventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) FindAll() ([]*model.Event, error) {
	var events []*model.Event
	err := r.db.Find(&events).Error
	return events, err
}

func (r *EventRepository) FindByID(id uint) (*model.Event, error) {
	var event model.Event
	err := r.db.First(&event, id).Error
	return &event, err
}

func (r *EventRepository) Create(event *model.Event) error {
	return r.db.Create(event).Error
}

func (r *EventRepository) Update(event *model.Event) error {
	return r.db.Save(event).Error
}

func (r *EventRepository) Delete(id uint) error {
	return r.db.Delete(&model.Event{}, id).Error
}
