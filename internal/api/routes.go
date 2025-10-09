package api

import (
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

type UserHandler interface {
	GetUser(c *gin.Context)
	Register(c *gin.Context)
	Login(c *gin.Context)
}

type PlaceHandler interface {
	GetPlaces(c *gin.Context)
	AddPlace(c *gin.Context)
	UpdatePlace(c *gin.Context)
	DeletePlace(c *gin.Context)
}

type ReviewHandler interface {
	GetReviewsByPlace(c *gin.Context)
}

type EventHandler interface {
	GetEvents(c *gin.Context)
	CreateEvent(c *gin.Context)
	UpdateEvent(c *gin.Context)
	DeleteEvent(c *gin.Context)
}

type IAHandler interface {
	GenerateAIResponse(c *gin.Context)
}

func RegisterRoutes(router *gin.Engine, u UserHandler, p PlaceHandler, r ReviewHandler, e EventHandler, ia IAHandler) {

	// Public Routes
	router.POST("/users/register", u.Register)
	router.POST("/users/login", u.Login)

	// --- Authenticated Routes (for any logged-in user) ---
	authGroup := router.Group("/")
	authGroup.Use(middleware.AuthMiddleware())
	{
		// Places & Reviews (Read-only for normal users)
		authGroup.GET("/places", p.GetPlaces)
		authGroup.GET("/places/:id/reviews", r.GetReviewsByPlace)

		// Events (Read-only for normal users)
		authGroup.GET("/events", e.GetEvents)

		// AI Assistant
		authGroup.POST("/ia/prompt", ia.GenerateAIResponse)

		// User info
		authGroup.GET("/users/:id", u.GetUser)
	}

	// --- Admin Routes (requires admin role) ---
	adminGroup := router.Group("/")
	adminGroup.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
	{
		// Places Management
		adminGroup.POST("/places", p.AddPlace)
		adminGroup.PUT("/places/:id", p.UpdatePlace)
		adminGroup.DELETE("/places/:id", p.DeletePlace)

		// Events Management
		adminGroup.POST("/events", e.CreateEvent)
		adminGroup.PUT("/events/:id", e.UpdateEvent)
		adminGroup.DELETE("/events/:id", e.DeleteEvent)
	}
}
