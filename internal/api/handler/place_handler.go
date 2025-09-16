package handler

import (
	"net/http"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/gin-gonic/gin"
)

type PlaceService interface {
	GetPlaces(query string) ([]*model.Place, error)
	AddNewPlace(place *model.Place) error
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
