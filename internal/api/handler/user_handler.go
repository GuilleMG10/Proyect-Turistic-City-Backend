package handler

import (
	"net/http"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/gin-gonic/gin"
)

type UserService interface {
	GetUser(id int) (*model.User, error)
}
type UserHandler struct {
	userService UserService
}

func NewUserController(userService UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

func (h *UserHandler) GetAllUsers(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"data":    "Pepito",
		"message": "Users retrieved successfully",
	})
}
