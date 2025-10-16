package service

import (
	"errors"
	"testing"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang.org/x/crypto/bcrypt"
)

// MockUserRepository es un mock de la interfaz UserRepository
type MockUserRepository struct {
	mock.Mock
}

// Implementación de los métodos de la interfaz UserRepository
func (m *MockUserRepository) FindUserByID(id int) (*model.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserRepository) FindUserByUsername(username string) (*model.User, error) {
	args := m.Called(username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserRepository) CreateUser(user *model.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) FindInterestsByUserID(userID uint) ([]*model.Event, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.Event), args.Error(1)
}

// --- Pruebas para GetUser ---

func TestUserService_GetUser(t *testing.T) {
	mockRepo := new(MockUserRepository)
	userService := NewUserService(mockRepo)

	t.Run("Éxito - Usuario encontrado", func(t *testing.T) {
		expectedUser := &model.User{ID: 1, Username: "testuser"}
		mockRepo.On("FindUserByID", 1).Return(expectedUser, nil).Once()

		user, err := userService.GetUser(1)

		assert.Nil(t, err)
		assert.Equal(t, expectedUser, user)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Fallo - Usuario no encontrado", func(t *testing.T) {
		repoError := errors.New("user not found")
		mockRepo.On("FindUserByID", 99).Return(nil, repoError).Once()

		user, err := userService.GetUser(99)

		assert.NotNil(t, err)
		assert.Nil(t, user)
		assert.Equal(t, repoError, err)
		mockRepo.AssertExpectations(t)
	})
}

// --- Pruebas para AddUser (Registro) ---

func TestUserService_AddUser(t *testing.T) {
	mockRepo := new(MockUserRepository)
	userService := NewUserService(mockRepo)

	rawPassword := "SecurePass123"
	newUser := &model.User{Name: "New User", Username: "newuser"}

	t.Run("Éxito - Usuario creado correctamente", func(t *testing.T) {
		// Se espera que CreateUser sea llamado con un *model.User que tiene el campo PasswordHash lleno
		mockRepo.On("CreateUser", mock.AnythingOfType("*model.User")).Return(nil).Once()

		err := userService.AddUser(newUser, rawPassword)

		assert.Nil(t, err)
		assert.NotEmpty(t, newUser.PasswordHash, "El PasswordHash no debería estar vacío después de AddUser")
		assert.Equal(t, uint(4), newUser.RoleID, "El RoleID debería ser 4")
		assert.True(t, newUser.Active, "El campo Active debería ser true")

		// Verificar que el hash de la contraseña es válido
		errHash := bcrypt.CompareHashAndPassword([]byte(newUser.PasswordHash), []byte(rawPassword))
		assert.Nil(t, errHash, "La contraseña plana debería coincidir con el hash")

		mockRepo.AssertExpectations(t)
	})

	t.Run("Fallo - Error al crear en el repositorio", func(t *testing.T) {
		repoError := errors.New("database error")
		// Es importante resetear el mock y el objeto si se reutiliza
		userWithError := &model.User{Name: "Err User", Username: "erruser"}

		mockRepo.On("CreateUser", mock.AnythingOfType("*model.User")).Return(repoError).Once()

		err := userService.AddUser(userWithError, rawPassword)

		assert.NotNil(t, err)
		assert.Equal(t, repoError, err)
		mockRepo.AssertExpectations(t)
	})
}

// --- Pruebas para Login ---

func TestUserService_Login(t *testing.T) {
	mockRepo := new(MockUserRepository)
	userService := NewUserService(mockRepo)

	// Generar un hash de prueba para el mock de usuario
	rawPassword := "loginpass"
	hash, _ := bcrypt.GenerateFromPassword([]byte(rawPassword), bcrypt.DefaultCost)
	hashedPassword := string(hash)

	// Usuario con hash de contraseña
	existingUser := &model.User{
		ID: 1, Username: "logged_user", PasswordHash: hashedPassword,
	}

	t.Run("Éxito - Credenciales correctas", func(t *testing.T) {
		mockRepo.On("FindUserByUsername", "logged_user").Return(existingUser, nil).Once()

		user, err := userService.Login("logged_user", rawPassword)

		assert.Nil(t, err)
		assert.Equal(t, existingUser.ID, user.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Fallo - Usuario no encontrado", func(t *testing.T) {
		repoError := errors.New("user not found")
		mockRepo.On("FindUserByUsername", "nonexistent").Return(nil, repoError).Once()

		user, err := userService.Login("nonexistent", "anypass")

		assert.NotNil(t, err)
		assert.Nil(t, user)
		assert.Equal(t, repoError, err) // El servicio propaga el error del repo.
		mockRepo.AssertExpectations(t)
	})

	t.Run("Fallo - Contraseña incorrecta", func(t *testing.T) {
		mockRepo.On("FindUserByUsername", "logged_user").Return(existingUser, nil).Once()

		user, err := userService.Login("logged_user", "wrongpassword")

		assert.NotNil(t, err)
		assert.Nil(t, user)
		// El servicio no devuelve el error de bcrypt, sino un 'nil' para el usuario y un error
		assert.True(t, errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) || err.Error() == "hashed password is not the hash of the given password", "El error debería ser por contraseña incorrecta o un error genérico")
		mockRepo.AssertExpectations(t)
	})
}
