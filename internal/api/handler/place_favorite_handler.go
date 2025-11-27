package handler

import (
	"net/http"
	"strconv"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/gin-gonic/gin"
)

type PlaceFavoriteService interface {
	GetUserFavorites(userID int) ([]model.PlaceFavorite, error)
	AddFavorite(userID, placeID int) (*model.PlaceFavorite, error)
	RemoveFavorite(userID, placeID int) error
}

type PlaceFavoriteHandler struct {
	placeFavoriteService PlaceFavoriteService
}

func NewPlaceFavoriteHandler(placeFavoriteService PlaceFavoriteService) *PlaceFavoriteHandler {
	return &PlaceFavoriteHandler{placeFavoriteService: placeFavoriteService}
}

// GetUserFavorites handles GET /users/:id/favorites
func (h *PlaceFavoriteHandler) GetUserFavorites(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	// --- SECURITY CHECK ---
    tokenUserID, _ := c.Get("userID") // Asumimos que el middleware Auth ya validó que existe
    roleID, _ := c.Get("roleID")

	// Si el ID del token NO coincide con el ID de la URL Y no es admin...
    // Si el ID del token NO coincide con el ID de la URL Y no es admin...
    if tokenUserID.(uint) != uint(userID) && roleID.(uint) != 1 {
        c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
        return
    }

	favorites, err := h.placeFavoriteService.GetUserFavorites(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch favorites"})
		return
	}

	c.JSON(http.StatusOK, favorites)
}

// AddFavorite handles POST /users/:id/favorites
func (h *PlaceFavoriteHandler) AddFavorite(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	// --- SECURITY CHECK ---
    tokenUserID, _ := c.Get("userID")
    if tokenUserID.(uint) != uint(userID) {
        c.JSON(http.StatusForbidden, gin.H{"error": "cannot add favorites for another user"})
        return
    }

	var req struct {
		PlaceID int `json:"place_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "place_id is required"})
		return
	}

	favorite, err := h.placeFavoriteService.AddFavorite(userID, req.PlaceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not add favorite"})
		return
	}

	c.JSON(http.StatusCreated, favorite)
}

// RemoveFavorite handles DELETE /users/:id/favorites/:placeId
func (h *PlaceFavoriteHandler) RemoveFavorite(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}
	// --- SECURITY CHECK ---
    tokenUserID, _ := c.Get("userID")
    if tokenUserID.(uint) != uint(userID) {
        c.JSON(http.StatusForbidden, gin.H{"error": "cannot delete favorites of another user"})
        return
    }
    // ----------------------

	placeIDStr := c.Param("place_id")
	placeID, err := strconv.Atoi(placeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid place id"})
		return
	}

	if err := h.placeFavoriteService.RemoveFavorite(userID, placeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
