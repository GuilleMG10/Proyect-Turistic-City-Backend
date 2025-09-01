package main

import (
	"log"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/api"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/api/handler"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/repository"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/service"
	"github.com/gin-gonic/gin"
)

func main() {
	userRepo := repository.NewUserRepository()
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserController(userService)

	router := gin.Default()
	api.RegisterRoutes(router, userHandler)

	if err := router.Run(":8081"); err != nil {
		log.Fatalf("Could not initialize the backend. Error: %v", err)
	}
}
