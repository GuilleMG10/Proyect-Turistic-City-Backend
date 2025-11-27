package handler

import (
	"net/http"
	"strconv"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/auth"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/gin-gonic/gin"
	"time" 
    "math/rand"
)

func isOwnerOrAdmin(c *gin.Context, resourceOwnerID uint) bool {
    tokenUserID, exists := c.Get("userID")
    if !exists {
        return false
    }
    
    roleID, _ := c.Get("roleID")
    isAdmin := roleID == uint(1) // Asumiendo que 1 es Admin

    // Si es el dueño O es admin, retorna true
    return tokenUserID.(uint) == resourceOwnerID || isAdmin
}

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

	// --- SECURITY CHECK (IDOR FIX) ---
    // Verificamos si el usuario del token es el mismo que el ID solicitado
    if !isOwnerOrAdmin(c, uint(id)) {
        c.JSON(http.StatusForbidden, gin.H{"error": "access denied: you can only view your own profile"})
        return
    }
    // ---------------------------------
	
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
		Name     string `json:"name"`
		Age      int    `json:"age"`
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
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
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	user, err := h.userService.Login(req.Username, req.Password)
	if err != nil {
		time.Sleep(time.Duration(100+rand.Intn(200)) * time.Millisecond)
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
