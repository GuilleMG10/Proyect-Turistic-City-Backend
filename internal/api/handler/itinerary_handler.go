package handler

import (
	"net/http"
	"strconv"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/service"
	"github.com/gin-gonic/gin"
)

type ItineraryHandler struct {
	service *service.ItineraryService
}

func NewItineraryHandler(service *service.ItineraryService) *ItineraryHandler {
	return &ItineraryHandler{service: service}
}

// GetItineraries returns all itineraries for the authenticated user
// GET /itineraries
func (h *ItineraryHandler) GetItineraries(c *gin.Context) {
	// Get user ID from JWT context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	itineraries, err := h.service.GetUserItineraries(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener itinerarios"})
		return
	}

	c.JSON(http.StatusOK, itineraries)
}

// GetItinerary returns a single itinerary by ID
// GET /itineraries/:id
func (h *ItineraryHandler) GetItinerary(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	itinerary, err := h.service.GetItinerary(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Itinerario no encontrado"})
		return
	}

	// Verify ownership
	userID, _ := c.Get("userID")
	if itinerary.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permiso para ver este itinerario"})
		return
	}

	c.JSON(http.StatusOK, itinerary)
}

// CreateItinerary creates a new itinerary
// POST /itineraries
func (h *ItineraryHandler) CreateItinerary(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	var itinerary model.Itinerary
	if err := c.ShouldBindJSON(&itinerary); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	itinerary.UserID = userID.(uint)
	itinerary.ID = 0 // Ensure new record

	if err := h.service.CreateItinerary(&itinerary); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear itinerario"})
		return
	}

	// Reload to get items with populated places/events
	created, _ := h.service.GetItinerary(itinerary.ID)
	if created != nil {
		c.JSON(http.StatusCreated, created)
	} else {
		c.JSON(http.StatusCreated, itinerary)
	}
}

// UpdateItinerary updates an existing itinerary
// PUT /itineraries/:id
func (h *ItineraryHandler) UpdateItinerary(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Verify ownership
	existing, err := h.service.GetItinerary(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Itinerario no encontrado"})
		return
	}

	userID, _ := c.Get("userID")
	if existing.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permiso para modificar este itinerario"})
		return
	}

	var updateData struct {
		Name        string                `json:"name"`
		Date        string                `json:"date"`
		StartTime   string                `json:"start_time"`
		EndTime     string                `json:"end_time"`
		Budget      float64               `json:"budget"`
		Preferences string                `json:"preferences"`
		TotalCost   float64               `json:"total_cost"`
		Items       []model.ItineraryItem `json:"items"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Update fields
	existing.Name = updateData.Name
	existing.Date = updateData.Date
	existing.StartTime = updateData.StartTime
	existing.EndTime = updateData.EndTime
	existing.Budget = updateData.Budget
	existing.Preferences = updateData.Preferences
	existing.TotalCost = updateData.TotalCost

	if err := h.service.UpdateItinerary(existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar itinerario"})
		return
	}

	// If items are provided, replace them
	if updateData.Items != nil {
		if err := h.service.ReplaceItems(uint(id), updateData.Items); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar items"})
			return
		}
	}

	// Reload and return
	updated, _ := h.service.GetItinerary(uint(id))
	c.JSON(http.StatusOK, updated)
}

// DeleteItinerary removes an itinerary
// DELETE /itineraries/:id
func (h *ItineraryHandler) DeleteItinerary(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Verify ownership
	existing, err := h.service.GetItinerary(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Itinerario no encontrado"})
		return
	}

	userID, _ := c.Get("userID")
	if existing.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permiso para eliminar este itinerario"})
		return
	}

	if err := h.service.DeleteItinerary(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar itinerario"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Itinerario eliminado exitosamente"})
}

// DeleteItem removes an item from an itinerary
// DELETE /itineraries/:id/items/:item_id
func (h *ItineraryHandler) DeleteItem(c *gin.Context) {
	itineraryID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de itinerario inválido"})
		return
	}

	itemID, err := strconv.ParseUint(c.Param("item_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de item inválido"})
		return
	}

	// Verify ownership
	existing, err := h.service.GetItinerary(uint(itineraryID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Itinerario no encontrado"})
		return
	}

	userID, _ := c.Get("userID")
	if existing.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permiso para modificar este itinerario"})
		return
	}

	if err := h.service.DeleteItem(uint(itemID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item eliminado"})
}
