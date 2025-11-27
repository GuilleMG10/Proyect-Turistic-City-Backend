package handler

import (
	"net/http"
	"strconv"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/gin-gonic/gin"
)

type UserInterestService interface {
	GetUserInterests(userID uint) ([]*model.UserInterest, error)
	AddUserInterest(userID uint, eventID uint) (*model.UserInterest, error)
	RemoveUserInterest(userID uint, eventID uint) error
}

type UserInterestHandler struct {
	userInterestService UserInterestService
}

func NewUserInterestHandler(userInterestService UserInterestService) *UserInterestHandler {
	return &UserInterestHandler{
		userInterestService: userInterestService,
	}
}

// GET /users/:id/interests
func (h *UserInterestHandler) GetUserInterests(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	// --- SECURITY CHECK ---
    tokenUserID, _ := c.Get("userID")
    roleID, _ := c.Get("roleID")

    // Comparamos uint con uint directamente
    if tokenUserID.(uint) != uint(userID) && roleID.(uint) != 1 {
        c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
        return
    }
    // ----------------------

	interests, err := h.userInterestService.GetUserInterests(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch user interests"})
		return
	}

	c.JSON(http.StatusOK, interests)
}

// POST /users/:id/interests
func (h *UserInterestHandler) AddUserInterest(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	// --- SECURITY CHECK ---
    tokenUserID, _ := c.Get("userID")
    if tokenUserID.(uint) != uint(userID) {
         c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
         return
    }
    // ----------------------

	var request struct {
		EventID uint `json:"event_id"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	interest, err := h.userInterestService.AddUserInterest(uint(userID), request.EventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create interest"})
		return
	}

	c.JSON(http.StatusCreated, interest)
}

// DELETE /users/:id/interests/:eventId
func (h *UserInterestHandler) RemoveUserInterest(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	// --- SECURITY CHECK ---
    tokenUserID, _ := c.Get("userID")
    if tokenUserID.(uint) != uint(userID) {
         c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
         return
    }
    // ----------------------
	
	eventIDStr := c.Param("event_id")
	eventID, err := strconv.ParseUint(eventIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event ID"})
		return
	}

	if err := h.userInterestService.RemoveUserInterest(uint(userID), uint(eventID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not remove interest"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "interest removed successfully"})
}
