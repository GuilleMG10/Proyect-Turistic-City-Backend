package model

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `json:"name"`
	Age          int       `json:"age"`
	Username     string    `gorm:"unique" json:"username"`
	PasswordHash string    `json:"-"`
	RoleID       uint      `json:"role_id"`
	Email        string    `gorm:"unique" json:"email"`
	CreatedAt    time.Time `json:"created_at"`
	Active       bool      `json:"active"`
}
