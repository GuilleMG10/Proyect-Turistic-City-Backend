package repository

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"gorm.io/gorm"
)

type ItineraryRepository struct {
	db *gorm.DB
}

func NewItineraryRepository(db *gorm.DB) *ItineraryRepository {
	return &ItineraryRepository{db: db}
}

// GetByUserID returns all itineraries for a user with their items
func (r *ItineraryRepository) GetByUserID(userID uint) ([]model.Itinerary, error) {
	var itineraries []model.Itinerary
	err := r.db.Where("user_id = ?", userID).
		Preload("Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("itinerary_items.\"order\" ASC")
		}).
		Preload("Items.Place").
		Preload("Items.Event").
		Order("created_at DESC").
		Find(&itineraries).Error
	return itineraries, err
}

// GetByID returns a single itinerary with all its items
func (r *ItineraryRepository) GetByID(id uint) (*model.Itinerary, error) {
	var itinerary model.Itinerary
	err := r.db.Where("id = ?", id).
		Preload("Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("itinerary_items.\"order\" ASC")
		}).
		Preload("Items.Place").
		Preload("Items.Event").
		First(&itinerary).Error
	if err != nil {
		return nil, err
	}
	return &itinerary, nil
}

// Create creates a new itinerary with its items
func (r *ItineraryRepository) Create(itinerary *model.Itinerary) error {
	return r.db.Create(itinerary).Error
}

// Update updates an itinerary (without items)
func (r *ItineraryRepository) Update(itinerary *model.Itinerary) error {
	return r.db.Save(itinerary).Error
}

// Delete removes an itinerary and all its items (cascade)
func (r *ItineraryRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete items first
		if err := tx.Where("itinerary_id = ?", id).Delete(&model.ItineraryItem{}).Error; err != nil {
			return err
		}
		// Delete itinerary
		return tx.Delete(&model.Itinerary{}, id).Error
	})
}

// AddItem adds an item to an itinerary
func (r *ItineraryRepository) AddItem(item *model.ItineraryItem) error {
	return r.db.Create(item).Error
}

// UpdateItem updates an itinerary item
func (r *ItineraryRepository) UpdateItem(item *model.ItineraryItem) error {
	return r.db.Save(item).Error
}

// DeleteItem removes an item from an itinerary
func (r *ItineraryRepository) DeleteItem(itemID uint) error {
	return r.db.Delete(&model.ItineraryItem{}, itemID).Error
}

// ReplaceItems replaces all items in an itinerary
func (r *ItineraryRepository) ReplaceItems(itineraryID uint, items []model.ItineraryItem) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete existing items
		if err := tx.Where("itinerary_id = ?", itineraryID).Delete(&model.ItineraryItem{}).Error; err != nil {
			return err
		}
		// Insert new items
		for i := range items {
			items[i].ItineraryID = itineraryID
			items[i].ID = 0 // Reset ID for new insert
			if err := tx.Create(&items[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
