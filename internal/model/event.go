package model

import "time"

type Event struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `json:"user_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	Latitude    float64   `gorm:"type:decimal(10,8)" json:"latitude"`
	Longitude   float64   `gorm:"type:decimal(11,8)" json:"longitude"`
	EventDate   time.Time `json:"event_date"`
	Category    string    `json:"category"`
	Price       float64   `json:"price"`
	CreatedAt   time.Time `json:"created_at"`
}
