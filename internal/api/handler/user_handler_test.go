package handler

import (
	"bytes"
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

// Mock del UserService
type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) GetUser(id int) (*model.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserService) AddUser(user *model.User, rawPassword string) error {
	args := m.Called(user, rawPassword)
	return args.Error(0)
}

func (m *MockUserService) Login(username, password string) (*model.User, error) {
	args := m.Called(username, password)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func TestUserHandler_GetUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Éxito - debe devolver 200 OK con el usuario", func(t *testing.T) {
		mockService := new(MockUserService)
		userHandler := NewUserHandler(mockService)

		router := gin.Default()
		router.GET("/users/:id", userHandler.GetUser)

		expectedUser := &model.User{ID: 1, Name: "Test User"}
		mockService.On("GetUser", 1).Return(expectedUser, nil)

		req, _ := http.NewRequest(http.MethodGet, "/users/1", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockService.AssertExpectations(t)
	})

	t.Run("Fallo - ID de usuario inválido", func(t *testing.T) {
		mockService := new(MockUserService)
		userHandler := NewUserHandler(mockService)
		router := gin.Default()
		router.GET("/users/:id", userHandler.GetUser)

		req, _ := http.NewRequest(http.MethodGet, "/users/abc", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("Fallo - usuario no encontrado", func(t *testing.T) {
		mockService := new(MockUserService)
		userHandler := NewUserHandler(mockService)
		router := gin.Default()
		router.GET("/users/:id", userHandler.GetUser)

		mockService.On("GetUser", 2).Return(nil, errors.New("not found"))

		req, _ := http.NewRequest(http.MethodGet, "/users/2", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		mockService.AssertExpectations(t)
	})
}

func TestUserHandler_Register(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Éxito - debe devolver 201 Created", func(t *testing.T) {
		mockService := new(MockUserService)
		userHandler := NewUserHandler(mockService)
		router := gin.Default()
		router.POST("/register", userHandler.Register)

		userData := gin.H{
			"name":     "New User",
			"username": "newuser",
			"password": "password123",
			"email":    "new@example.com",
		}

		mockService.On("AddUser", mock.AnythingOfType("*model.User"), "password123").Return(nil)

		body, _ := json.Marshal(userData)
		req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockService.AssertExpectations(t)
	})
}

func TestUserHandler_Login(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Éxito - debe devolver 200 OK", func(t *testing.T) {
		mockService := new(MockUserService)
		userHandler := NewUserHandler(mockService)
		router := gin.Default()
		router.POST("/login", userHandler.Login)

		loginData := gin.H{"username": "testuser", "password": "password"}
		expectedUser := &model.User{ID: 1, Username: "testuser"}

		mockService.On("Login", "testuser", "password").Return(expectedUser, nil)

		body, _ := json.Marshal(loginData)
		req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockService.AssertExpectations(t)
	})

	t.Run("Fallo - credenciales inválidas", func(t *testing.T) {
		mockService := new(MockUserService)
		userHandler := NewUserHandler(mockService)
		router := gin.Default()
		router.POST("/login", userHandler.Login)

		loginData := gin.H{"username": "testuser", "password": "wrongpassword"}

		mockService.On("Login", "testuser", "wrongpassword").Return(nil, errors.New("invalid credentials"))

		body, _ := json.Marshal(loginData)
		req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
		mockService.AssertExpectations(t)
	})
}