package main

import (
	"log"
	"os"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/api"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/api/handler"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
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

	dsn := os.Getenv("CONNECTION_STRING_URI")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	if err := db.AutoMigrate(&model.User{}); err != nil {
		log.Fatalf("Could not migrate database: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserController(userService)

	router := gin.Default()
	api.RegisterRoutes(router, userHandler)

	if err := router.Run(":8081"); err != nil {
		log.Fatalf("Could not start server: %v", err)
	}
}
