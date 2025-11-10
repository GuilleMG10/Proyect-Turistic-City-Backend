package model

import (
	"time"
)

type Place struct {
	ID     uint   `gorm:"primaryKey;unique;autoIncrement" json:"id"`
	UserID uint   `gorm:"column:user_id" json:"user_id"` // Generalmente se añade en el servicio, no se valida en el binding
	Name   string `gorm:"column:name" json:"name" binding:"required,min=3,max=100"`
	Description string `gorm:"column:description" json:"description" binding:"required,min=20,max=2000"`
	Location string `gorm:"column:location" json:"location" binding:"required,min=5"`
	Latitude float64 `gorm:"column:latitude;type:decimal(10,8)" json:"latitude" binding:"required,latitude"`
	Longitude float64 `gorm:"column:longitude;type:decimal(11,8)" json:"longitude" binding:"required,longitude"`
	Category string `gorm:"column:category" json:"category" binding:"required"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	LinkImage string `gorm:"column:link_image" json:"link_image" binding:"required,url"` // Valida que sea una URL
	Active  bool   `gorm:"column:active" json:"active"`

	// Relaciones (GORM las usará para JOINs y Preloads)
	Reviews []Review `gorm:"foreignKey:PlaceID" json:"reviews,omitempty"`
	User    User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Place) TableName() string {
	return "places"
}
