package handler

import (
	"net/http"
	"strconv"
	"errors" // <-- Importar
    "github.com/go-playground/validator/v10"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/auth"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/gin-gonic/gin"
)

type UserService interface {
	GetUser(id int) (*model.User, error)
	AddUser(user *model.User, rawPassword string) error
	Login(username, password string) (*model.User, error)
}

type UserHandler struct {
	userService UserService
}

func NewUserHandler(userService UserService) *UserHandler {
	return &UserHandler{userService: userService}
}
func (h *UserHandler) GetUser(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	user, err := h.userService.GetUser(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       user.ID,
		"name":     user.Name,
		"age":      user.Age,
		"username": user.Username,
		"email":    user.Email,
		"role_id":  user.RoleID,
		"active":   user.Active,
	})
}

func (h *UserHandler) Register(c *gin.Context) {
	var req struct {
        // --- INICIO DE CAMBIOS ---
		Name     string `json:"name" binding:"required,min=2,max=100"`
		Age      int    `json:"age" binding:"required,gt=0,lt=120"` // gt=greater than, lt=less than
		Username string `json:"username" binding:"required,min=3,max=50"`
		Password string `json:"password" binding:"required,min=8,max=72"` // min 8 caracteres
		Email    string `json:"email" binding:"required,email"`         // Valida formato email
        // --- FIN DE CAMBIOS ---
	}

	if err := c.ShouldBindJSON(&req); err != nil {
        // --- INICIO DE CAMBIOS: MANEJO DETALLADO DE ERROR ---
		var ve validator.ValidationErrors
		if errors.As(err, &ve) {
            // Construye un mapa de errores más útil
			out := make(map[string]string, len(ve))
			for _, fe := range ve {
				out[fe.Field()] = getErrorMsg(fe) // Usa una función helper
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": "validation failed", "details": out})
		} else {
            // Error de formato JSON, no de validación
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "details": err.Error()})
		}
        // --- FIN DE CAMBIOS ---
		return
	}

	user := &model.User{
		Name:     req.Name,
		Age:      req.Age,
		Username: req.Username,
		Email:    req.Email,
	}

	if err := h.userService.AddUser(user, req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "user created successfully",
		"user": gin.H{
			"id":       user.ID,
			"name":     user.Name,
			"username": user.Username,
			"email":    user.Email,
			"role_id":  user.RoleID,
			"active":   user.Active,
		},
	})
}

func (h *UserHandler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	user, err := h.userService.Login(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Username, user.RoleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "login successful",
		"token":   token,
		"user": gin.H{
			"id":       user.ID,
			"name":     user.Name,
			"username": user.Username,
			"email":    user.Email,
			"role_id":  user.RoleID,
		},
	})
}

func getErrorMsg(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Invalid email format"
	case "min":
		return "Should be at least " + fe.Param() + " characters"
	case "max":
		return "Should be at most " + fe.Param() + " characters"
    case "gt":
        return "Should be greater than " + fe.Param()
    case "lt":
        return "Should be less than " + fe.Param()
	}
	return "Unknown validation error" // Fallback
}