package handler

import (
	"net/http"
	"strconv"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/service"
	"github.com/gin-gonic/gin"
)

type UserPreferenceHandler struct {
	service *service.UserPreferenceService
}

func NewUserPreferenceHandler(service *service.UserPreferenceService) *UserPreferenceHandler {
	return &UserPreferenceHandler{service: service}
}

// GetUserPreferences returns all preferences for a user
// GET /users/:id/preferences
func (h *UserPreferenceHandler) GetUserPreferences(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuario inválido"})
		return
	}

	preferences, err := h.service.GetUserPreferences(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener preferencias"})
		return
	}

	c.JSON(http.StatusOK, preferences)
}

// SaveUserPreferences saves/replaces all preferences for a user
// POST /users/:id/preferences
// Body: { "categories": ["Museo", "Parque", "Restaurante"] }
func (h *UserPreferenceHandler) SaveUserPreferences(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuario inválido"})
		return
	}

	var request struct {
		Categories []string `json:"categories" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: se requiere un array de categorías"})
		return
	}

	if len(request.Categories) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Debes seleccionar al menos una categoría"})
		return
	}

	if err := h.service.SaveUserPreferences(uint(userID), request.Categories); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar preferencias"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Preferencias guardadas exitosamente"})
}

// DeleteUserPreference removes a specific preference
// DELETE /users/:id/preferences/:category
func (h *UserPreferenceHandler) DeleteUserPreference(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de usuario inválido"})
		return
	}

	category := c.Param("category")
	if category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Categoría requerida"})
		return
	}

	if err := h.service.DeletePreference(uint(userID), category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar preferencia"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Preferencia eliminada"})
}
