package main

import (
	"fmt"
	"log"
	"os"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/api"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/api/handler"
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
		log.Fatalf("Error cargando .env: %v", err)
	}
	dsn := fmt.Sprintf(
		"user=%s password=%s host=%s port=%s dbname=%s sslmode=require",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)
	fmt.Println("DSN:", dsn)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	// if err := db.AutoMigrate(&model.User{}); err != nil {
	// 	log.Fatalf("Could not migrate database: %v", err)
	// }

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	placeRepo := repository.NewPlaceRepository(db)
	placeService := service.NewPlaceService(placeRepo)
	placeHandler := handler.NewPlaceHandler(placeService)

	reviewRepo := repository.NewReviewRepository(db)
	reviewService := service.NewReviewService(reviewRepo)
	reviewHandler := handler.NewReviewHandler(reviewService)

	router := gin.Default()
	router.Use(middleware.CORS())
	api.RegisterRoutes(router, userHandler, placeHandler, reviewHandler)

	if err := router.Run(":8081"); err != nil {
		log.Fatalf("Could not start server: %v", err)
	}
}
