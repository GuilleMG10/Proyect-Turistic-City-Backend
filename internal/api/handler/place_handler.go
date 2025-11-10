package handler

import (
	"net/http"
	"strconv"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/gin-gonic/gin"
)

type PlaceService interface {
	GetPlaces(query string) ([]*model.Place, error)
	AddNewPlace(place *model.Place) error
	UpdateExistingPlace(place *model.Place) error
	DeleteExistingPlace(id uint) error
}

type PlaceHandler struct {
	placeService PlaceService
}

func NewPlaceHandler(placeService PlaceService) *PlaceHandler {
	return &PlaceHandler{
		placeService: placeService,
	}
}

// GET /places?q=...
func (h *PlaceHandler) GetPlaces(c *gin.Context) {
	query := c.Query("q")
	places, err := h.placeService.GetPlaces(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch places"})
		return
	}
	c.JSON(http.StatusOK, places)
}

// POST /places
func (h *PlaceHandler) AddPlace(c *gin.Context) {
	var newPlace model.Place
	if err := c.ShouldBindJSON(&newPlace); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if err := h.placeService.AddNewPlace(&newPlace); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create place"})
		return
	}
	c.JSON(http.StatusCreated, newPlace)
}

// PUT /places/:id
func (h *PlaceHandler) UpdatePlace(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid place ID format"})
		return
	}

	if id == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid place ID"})
		return
    }
	
	var place model.Place
	if err := c.ShouldBindJSON(&place); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Set the ID from the URL parameter to ensure the correct record is updated
	place.ID = uint(id)

	if err := h.placeService.UpdateExistingPlace(&place); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update place"})
		return
	}
	c.JSON(http.StatusOK, place)
}

// DELETE /places/:id
func (h *PlaceHandler) DeletePlace(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid place ID"})
		return
	}

	if err := h.placeService.DeleteExistingPlace(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete place"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "place deleted successfully"})
}
