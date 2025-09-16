package model

import (
	"time"
)

type Review struct {
	ID        uint      `gorm:"primaryKey;unique;autoIncrement" json:"id"`
	UserID    uint      `gorm:"column:user_id" json:"user_id"`
	PlaceID   *uint     `gorm:"column:place_id" json:"place_id,omitempty"`
	EventID   *uint     `gorm:"column:event_id" json:"event_id,omitempty"`
	Rating    int       `gorm:"column:rating" json:"rating"`
	Comment   string    `gorm:"column:comment" json:"comment"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Review) TableName() string {
	return "reviews"
}
