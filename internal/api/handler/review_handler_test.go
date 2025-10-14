package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mock del ReviewService
type MockReviewService struct {
	mock.Mock
}

func (m *MockReviewService) GetReviewsForPlace(placeID uint) ([]*model.Review, error) {
	args := m.Called(placeID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.Review), args.Error(1)
}

func TestReviewHandler_GetReviewsByPlace(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Éxito - debe devolver 200 OK con reseñas", func(t *testing.T) {
		mockService := new(MockReviewService)
		reviewHandler := NewReviewHandler(mockService)

		router := gin.Default()
		router.GET("/places/:id/reviews", reviewHandler.GetReviewsByPlace)

		expectedReviews := []*model.Review{
			{ID: 1, Comment: "¡Excelente!", Rating: 5, PlaceID: new(uint)}, // PlaceID inicializado
		}
		*expectedReviews[0].PlaceID = 1

		mockService.On("GetReviewsForPlace", uint(1)).Return(expectedReviews, nil)

		req, _ := http.NewRequest(http.MethodGet, "/places/1/reviews", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var returnedReviews []*model.Review
		json.Unmarshal(w.Body.Bytes(), &returnedReviews)
		assert.Equal(t, expectedReviews, returnedReviews)
		mockService.AssertExpectations(t)
	})

	t.Run("Fallo - ID de lugar inválido", func(t *testing.T) {
		mockService := new(MockReviewService)
		reviewHandler := NewReviewHandler(mockService)

		router := gin.Default()
		router.GET("/places/:id/reviews", reviewHandler.GetReviewsByPlace)

		req, _ := http.NewRequest(http.MethodGet, "/places/invalid-id/reviews", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("Fallo - el servicio devuelve un error", func(t *testing.T) {
		mockService := new(MockReviewService)
		reviewHandler := NewReviewHandler(mockService)

		router := gin.Default()
		router.GET("/places/:id/reviews", reviewHandler.GetReviewsByPlace)

		mockService.On("GetReviewsForPlace", uint(2)).Return(nil, errors.New("error de base de datos"))

		req, _ := http.NewRequest(http.MethodGet, "/places/2/reviews", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		mockService.AssertExpectations(t)
	})
}