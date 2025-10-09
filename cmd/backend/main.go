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
		"postgresql://%s:%s@%s:%s/%s?sslmode=require&statement_cache_mode=none&prefer_simple_protocol=true",
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

	// User dependencies
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	// Place dependencies
	placeRepo := repository.NewPlaceRepository(db)
	placeService := service.NewPlaceService(placeRepo)
	placeHandler := handler.NewPlaceHandler(placeService)

	// Review dependencies
	reviewRepo := repository.NewReviewRepository(db)
	reviewService := service.NewReviewService(reviewRepo)
	reviewHandler := handler.NewReviewHandler(reviewService)

	// Event dependencies
	eventRepo := repository.NewEventRepository(db)
	eventService := service.NewEventService(eventRepo)
	eventHandler := handler.NewEventHandler(eventService)

	// IA Handler
	iaHandler := handler.NewIAHandler(userService)

	router := gin.Default()
	router.Use(middleware.CORS())
	api.RegisterRoutes(router, userHandler, placeHandler, reviewHandler, eventHandler, iaHandler)

	if err := router.Run(":8081"); err != nil {
		log.Fatalf("Could not start server: %v", err)
	}
}
