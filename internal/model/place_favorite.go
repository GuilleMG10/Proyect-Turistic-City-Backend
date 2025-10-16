package model

import "time"

// PlaceFavorite represents a user's favorite place
type PlaceFavorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    int       `gorm:"not null;index" json:"user_id"`
	PlaceID   int       `gorm:"not null;index" json:"place_id"`
	Active    bool      `gorm:"default:true" json:"active"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
}

// TableName specifies the table name for PlaceFavorite
func (PlaceFavorite) TableName() string {
	return "user_place_favorites"
}
