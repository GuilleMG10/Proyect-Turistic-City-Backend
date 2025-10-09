package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	// Asegúrate de que la ruta de importación sea la correcta para tu proyecto
	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mock del PlaceService
type MockPlaceService struct {
	mock.Mock
}

// Implementamos AddNewPlace para cumplir la interfaz
func (m *MockPlaceService) AddNewPlace(place *model.Place) error {
	args := m.Called(place)
	return args.Error(0)
}

// ¡ARREGLO! Añadimos el método GetPlaces que faltaba para implementar completamente la interfaz
func (m *MockPlaceService) GetPlaces(query string) ([]*model.Place, error) {
	args := m.Called(query)
	// Si el primer argumento de retorno es nil, devolvemos nil para el slice de lugares
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	// De lo contrario, lo convertimos al tipo esperado
	return args.Get(0).([]*model.Place), args.Error(1)
}

// Función de Prueba para AddPlace
func TestPlaceHandler_AddPlace(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Éxito - debe devolver 201 Created", func(t *testing.T) {
		mockService := new(MockPlaceService)
		placeHandler := NewPlaceHandler(mockService)

		router := gin.Default()
		router.POST("/places", placeHandler.AddPlace)

		newPlace := &model.Place{
			Name:        "Museo de Arte Moderno",
			Description: "Un museo increíble.",
			Location:    "Calle Falsa 123",
		}

		mockService.On("AddNewPlace", mock.AnythingOfType("*model.Place")).Return(nil)

		body, _ := json.Marshal(newPlace)
		req, _ := http.NewRequest(http.MethodPost, "/places", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockService.AssertExpectations(t)
	})

	t.Run("Fallo - cuerpo de la petición inválido", func(t *testing.T) {
		mockService := new(MockPlaceService)
		placeHandler := NewPlaceHandler(mockService)
		router := gin.Default()
		router.POST("/places", placeHandler.AddPlace)

		invalidBody := []byte(`{"name": "Museo", "description": }`)
		req, _ := http.NewRequest(http.MethodPost, "/places", bytes.NewBuffer(invalidBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("Fallo - el servicio devuelve un error", func(t *testing.T) {
		mockService := new(MockPlaceService)
		placeHandler := NewPlaceHandler(mockService)
		router := gin.Default()
		router.POST("/places", placeHandler.AddPlace)

		newPlace := &model.Place{Name: "Lugar con problemas"}

		mockService.On("AddNewPlace", mock.AnythingOfType("*model.Place")).Return(errors.New("error de base de datos simulado"))

		body, _ := json.Marshal(newPlace)
		req, _ := http.NewRequest(http.MethodPost, "/places", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		mockService.AssertExpectations(t)
	})
}