package handler

import (
	"net/http"
	"strconv"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/gin-gonic/gin"
)

type ReviewService interface {
	GetReviewsForPlace(placeID uint) ([]*model.Review, error)
}

type ReviewHandler struct {
	reviewService ReviewService
}

func NewReviewHandler(reviewService ReviewService) *ReviewHandler {
	return &ReviewHandler{
		reviewService: reviewService,
	}
}

// GET /places/:id/reviews
func (h *ReviewHandler) GetReviewsByPlace(c *gin.Context) {
	// Extraemos el ID del lugar de los parámetros de la ruta
	placeIDStr := c.Param("id")
	placeID, err := strconv.ParseUint(placeIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid place ID"})
		return
	}

	reviews, err := h.reviewService.GetReviewsForPlace(uint(placeID))
	if err != nil {
		// Aquí puedes diferenciar errores, ej. si GORM devuelve "record not found"
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, reviews)
}
