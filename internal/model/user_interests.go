package model

import "time"

// UserInterest represents the user_interests join table.
type UserInterest struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"user_id"`
	EventID   uint      `json:"event_id"`
	Active    bool      `json:"active"`
	CreatedAt time.Time `json:"created_at"`

	// GORM relationship to preload Event details
	Event Event `gorm:"foreignKey:EventID" json:"event"`
}

func (UserInterest) TableName() string {
	return "user_interests"
}
