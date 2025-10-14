package service

import (
	"errors"
	"testing"
	"time"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// --- Mock del ReviewRepository ---

// MockReviewRepository es una implementación simulada de la interfaz ReviewRepository.
type MockReviewRepository struct {
	mock.Mock
}

// FindByPlaceID simula la llamada al método del repositorio.
func (m *MockReviewRepository) FindByPlaceID(placeID uint) ([]*model.Review, error) {
	args := m.Called(placeID)
	// Maneja el primer argumento de retorno (el slice de *model.Review)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.Review), args.Error(1)
}

// --- Pruebas del ReviewService ---

func TestReviewService_GetReviewsForPlace(t *testing.T) {
	// ID de lugar de prueba
	testPlaceID := uint(1)

	// Reseñas de prueba
	reviews := []*model.Review{
		{ID: 1, UserID: 1, PlaceID: &testPlaceID, Rating: 5, Comment: "Excelente lugar", CreatedAt: time.Now()},
		{ID: 2, UserID: 2, PlaceID: &testPlaceID, Rating: 4, Comment: "Muy bueno", CreatedAt: time.Now()},
	}

	t.Run("Éxito - debe devolver las reseñas correctamente", func(t *testing.T) {
		// 1. Configurar el Mock
		mockRepo := new(MockReviewRepository)
		// Esperamos que se llame a FindByPlaceID con testPlaceID y que devuelva las reseñas y nil como error.
		mockRepo.On("FindByPlaceID", testPlaceID).Return(reviews, nil)

		// 2. Crear el Servicio con el Mock
		reviewService := NewReviewService(mockRepo)

		// 3. Ejecutar la función a probar
		result, err := reviewService.GetReviewsForPlace(testPlaceID)

		// 4. Afirmaciones (Asserts)
		assert.NoError(t, err)                                     // No debe haber error
		assert.NotNil(t, result)                                   // El resultado no debe ser nil
		assert.Equal(t, len(reviews), len(result))                 // La cantidad de resultados debe coincidir
		assert.Equal(t, reviews[0].Comment, result[0].Comment)     // El contenido debe coincidir
		mockRepo.AssertExpectations(t)                             // Asegurar que el mock fue llamado
	})

	t.Run("Éxito - debe devolver una lista vacía si no hay reseñas", func(t *testing.T) {
		// 1. Configurar el Mock
		mockRepo := new(MockReviewRepository)
		emptyReviews := []*model.Review{}
		// Esperamos que devuelva una lista vacía y nil como error.
		mockRepo.On("FindByPlaceID", testPlaceID).Return(emptyReviews, nil)

		// 2. Crear el Servicio
		reviewService := NewReviewService(mockRepo)

		// 3. Ejecutar
		result, err := reviewService.GetReviewsForPlace(testPlaceID)

		// 4. Afirmaciones
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Empty(t, result) // La lista debe estar vacía
		mockRepo.AssertExpectations(t)
	})

	t.Run("Fallo - el repositorio devuelve un error", func(t *testing.T) {
		// 1. Configurar el Mock
		mockRepo := new(MockReviewRepository)
		repoError := errors.New("error simulado de base de datos")
		// Esperamos que devuelva nil y un error.
		mockRepo.On("FindByPlaceID", testPlaceID).Return(nil, repoError)

		// 2. Crear el Servicio
		reviewService := NewReviewService(mockRepo)

		// 3. Ejecutar
		result, err := reviewService.GetReviewsForPlace(testPlaceID)

		// 4. Afirmaciones
		assert.Error(t, err)                                        // Debe haber un error
		assert.Nil(t, result)                                       // El resultado debe ser nil
		assert.Equal(t, repoError.Error(), err.Error())             // El error debe ser el que simulamos
		mockRepo.AssertExpectations(t)
	})
}