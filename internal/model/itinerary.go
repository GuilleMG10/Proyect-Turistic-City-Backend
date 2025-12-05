package model

import "time"

// Itinerary represents a user's travel itinerary
type Itinerary struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"index" json:"user_id"`
	Name        string    `gorm:"size:255" json:"name"`
	Date        string    `gorm:"size:20" json:"date"`       // YYYY-MM-DD format
	StartTime   string    `gorm:"size:10" json:"start_time"` // HH:MM format
	EndTime     string    `gorm:"size:10" json:"end_time"`   // HH:MM format
	Budget      float64   `json:"budget"`
	Preferences string    `gorm:"type:text" json:"preferences"` // JSON string of categories
	TotalCost   float64   `json:"total_cost"`
	CreatedAt   time.Time `json:"created_at"`

	// Relationships
	Items []ItineraryItem `gorm:"foreignKey:ItineraryID" json:"items,omitempty"`
	User  *User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Itinerary) TableName() string {
	return "itineraries"
}

// ItineraryItem represents a place or event in an itinerary
type ItineraryItem struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ItineraryID uint      `gorm:"index" json:"itinerary_id"`
	PlaceID     *uint     `json:"place_id"` // Nullable - either place or event
	EventID     *uint     `json:"event_id"` // Nullable - either place or event
	Order       int       `json:"order"`    // Position in itinerary
	StartTime   string    `gorm:"size:10" json:"start_time"`
	EndTime     string    `gorm:"size:10" json:"end_time"`
	Notes       string    `gorm:"type:text" json:"notes"`
	CreatedAt   time.Time `json:"created_at"`

	// Relationships
	Place *Place `gorm:"foreignKey:PlaceID" json:"place,omitempty"`
	Event *Event `gorm:"foreignKey:EventID" json:"event,omitempty"`
}

func (ItineraryItem) TableName() string {
	return "itinerary_items"
}
