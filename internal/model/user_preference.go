package model

import "time"

// UserPreference represents a user's category preference for recommendations
type UserPreference struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index" json:"user_id"`
	Category  string    `gorm:"size:100" json:"category"`
	Active    bool      `gorm:"default:true" json:"active"`
	CreatedAt time.Time `json:"created_at"`

	// Unique constraint on user_id + category
	// This is handled in migration
}

func (UserPreference) TableName() string {
	return "user_preferences"
}
