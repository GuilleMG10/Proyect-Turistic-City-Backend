package model

import (
	"time"
)

type Place struct {
	ID          uint      `gorm:"primaryKey;unique;autoIncrement" json:"id"`
	UserID      uint      `gorm:"column:user_id" json:"user_id"`
	Name        string    `gorm:"column:name" json:"name"`
	Description string    `gorm:"column:description" json:"description"`
	Location    string    `gorm:"column:location" json:"location"`
	Latitude    float64   `gorm:"column:latitude;type:decimal(10,8)" json:"latitude"`
	Longitude   float64   `gorm:"column:longitude;type:decimal(11,8)" json:"longitude"`
	Category    string    `gorm:"column:category" json:"category"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"created_at"`
	LinkImage   string    `gorm:"column:link_image" json:"link_image"`
	Active      bool      `gorm:"column:active" json:"active"`

	// Relaciones (GORM las usará para JOINs y Preloads)
	Reviews []Review `gorm:"foreignKey:PlaceID" json:"reviews,omitempty"`
	User    User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Place) TableName() string {
	return "places"
}
