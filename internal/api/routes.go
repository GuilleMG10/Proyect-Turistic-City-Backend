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

type UserInterestHandler interface {
	GetUserInterests(c *gin.Context)
	AddUserInterest(c *gin.Context)
	RemoveUserInterest(c *gin.Context)
}

type PlaceFavoriteHandler interface {
	GetUserFavorites(c *gin.Context)
	AddFavorite(c *gin.Context)
	RemoveFavorite(c *gin.Context)
}

func RegisterRoutes(router *gin.Engine, u UserHandler, p PlaceHandler, r ReviewHandler, e EventHandler, ia IAHandler, ui UserInterestHandler, pf PlaceFavoriteHandler) {

	// Public Routes
	router.POST("/users/register", u.Register)
	router.POST("/users/login", u.Login)

	// Public read-only routes (no authentication required)
	router.GET("/places", p.GetPlaces)
	router.GET("/places/:id/reviews", r.GetReviewsByPlace)
	router.GET("/events", e.GetEvents)

	// --- Authenticated Routes (for any logged-in user) ---
	authGroup := router.Group("/")
	authGroup.Use(middleware.AuthMiddleware())
	{
		// AI Assistant
		authGroup.POST("/ia/prompt", ia.GenerateAIResponse)

		// User info
		authGroup.GET("/users/:id", u.GetUser)

		// User interests (favorites for events)
		authGroup.GET("/users/:id/interests", ui.GetUserInterests)
		authGroup.POST("/users/:id/interests", ui.AddUserInterest)
		authGroup.DELETE("/users/:id/interests/:event_id", ui.RemoveUserInterest)

		// Place favorites
		authGroup.GET("/users/:id/favorites", pf.GetUserFavorites)
		authGroup.POST("/users/:id/favorites", pf.AddFavorite)
		authGroup.DELETE("/users/:id/favorites/:place_id", pf.RemoveFavorite)
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
