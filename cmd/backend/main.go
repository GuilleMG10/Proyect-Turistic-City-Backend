package main

import (
	"fmt"
	"log"
	"os"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/api"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/api/handler"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/auth"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/middleware"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/repository"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Configure JWT
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable not set")
	}
	auth.Configure(jwtSecret)

	dsn := fmt.Sprintf(
		"user=%s password=%s host=%s port=%s dbname=%s sslmode=require",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	placeRepo := repository.NewPlaceRepository(db)
	placeService := service.NewPlaceService(placeRepo)
	placeHandler := handler.NewPlaceHandler(placeService)

	reviewRepo := repository.NewReviewRepository(db)
	reviewService := service.NewReviewService(reviewRepo)
	reviewHandler := handler.NewReviewHandler(reviewService)

	eventRepo := repository.NewEventRepository(db)
	eventService := service.NewEventService(eventRepo)
	eventHandler := handler.NewEventHandler(eventService)

	iaHandler := handler.NewIAHandler(userService)

	userInterestRepo := repository.NewUserInterestRepository(db)
	userInterestService := service.NewUserInterestService(userInterestRepo)
	userInterestHandler := handler.NewUserInterestHandler(userInterestService)

	placeFavoriteRepo := repository.NewPlaceFavoriteRepository(db)
	placeFavoriteService := service.NewPlaceFavoriteService(placeFavoriteRepo)
	placeFavoriteHandler := handler.NewPlaceFavoriteHandler(placeFavoriteService)

	userPreferenceRepo := repository.NewUserPreferenceRepository(db)
	userPreferenceService := service.NewUserPreferenceService(userPreferenceRepo)
	userPreferenceHandler := handler.NewUserPreferenceHandler(userPreferenceService)

	itineraryRepo := repository.NewItineraryRepository(db)
	itineraryService := service.NewItineraryService(itineraryRepo)
	itineraryHandler := handler.NewItineraryHandler(itineraryService)

	router := gin.Default()
	router.Use(middleware.CORS())

	api.RegisterRoutes(router, userHandler, placeHandler, reviewHandler, eventHandler, iaHandler, userInterestHandler, placeFavoriteHandler, userPreferenceHandler, itineraryHandler)

	if err := router.Run(":8081"); err != nil {
		log.Fatalf("Could not start server: %v", err)
	}
}
