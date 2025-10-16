## Tecnologías Principales

- **Go 1.x**: Lenguaje de programación principal
- **Gin**: Framework web HTTP para APIs REST
- **GORM**: ORM para interacción con base de datos PostgreSQL
- **JWT**: Autenticación basada en tokens
- **PostgreSQL (Supabase)**: Base de datos relacional en la nube
- **CORS**: Middleware para permitir peticiones cross-origin

## Estructura del Proyecto

```
cmd/
└── backend/
    └── main.go              # Punto de entrada de la aplicación

internal/
├── api/
│   ├── routes.go            # Definición de rutas HTTP
│   └── handler/             # Controladores HTTP
│       ├── event_handler.go
│       ├── place_handler.go
│       ├── user_handler.go
│       ├── review_handler.go
│       ├── user_interest_handler.go
│       ├── place_favorite_handler.go
│       └── ia_handler.go
├── auth/
│   └── jwt.go               # Generación y validación de JWT
├── middleware/
│   ├── auth.go              # Middleware de autenticación
│   └── cors.go              # Middleware de CORS
├── model/
│   ├── event.go             # Modelo de eventos
│   ├── place.go             # Modelo de lugares
│   ├── user.go              # Modelo de usuarios
│   ├── review.go            # Modelo de reseñas
│   ├── user_interest.go     # Modelo de intereses
│   └── place_favorite.go    # Modelo de favoritos
├── repository/
│   ├── event_repository.go
│   ├── place_repository.go
│   ├── user_repository.go
│   ├── review_repository.go
│   ├── user_interest_repository.go
│   └── place_favorite_repository.go
└── service/
    ├── event_service.go
    ├── place_service.go
    ├── user_service.go
    ├── review_service.go
    ├── user_interest_service.go
    └── place_favorite_service.go

go.mod                       # Dependencias de Go
```

## Arquitectura en Capas

El backend sigue una arquitectura en capas limpia:

### 1. Handler (Controlador)
- Recibe peticiones HTTP
- Valida datos de entrada
- Llama a la capa de servicio
- Devuelve respuestas HTTP

### 2. Service (Servicio)
- Lógica de negocio
- Validaciones complejas
- Orquestación entre múltiples repositorios
- Transformación de datos

### 3. Repository (Repositorio)
- Acceso directo a la base de datos
- Operaciones CRUD
- Consultas con GORM
- Gestión de relaciones

### 4. Model (Modelo)
- Estructuras de datos
- Mapeo ORM con tags de GORM
- Validaciones básicas

## Modelos de Datos

### User (Usuario)
```go
type User struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    RoleID    uint      `json:"role_id"`
    Name      string    `json:"name"`
    Username  string    `json:"username" gorm:"unique"`
    Password  string    `json:"-"`
    Email     string    `json:"email"`
    Age       int       `json:"age"`
    CreatedAt time.Time `json:"created_at"`
}
```

### Place (Lugar)
```go
type Place struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    UserID      uint      `json:"user_id"`
    Name        string    `json:"name"`
    Description string    `json:"description"`
    Location    string    `json:"location"`
    Latitude    float64   `json:"latitude"`
    Longitude   float64   `json:"longitude"`
    Category    string    `json:"category"`
    CreatedAt   time.Time `json:"created_at"`
    LinkImage   string    `json:"link_image"`
    Active      bool      `json:"active" gorm:"default:true"`
    Reviews     []Review  `json:"reviews,omitempty" gorm:"foreignKey:PlaceID"`
    User        User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}
```

### Event (Evento)
```go
type Event struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    UserID      uint      `json:"user_id"`
    Name        string    `json:"name"`
    Description string    `json:"description"`
    EventDate   time.Time `json:"event_date"`
    Location    string    `json:"location"`
    Price       float64   `json:"price"`
    MinAge      int       `json:"min_age"`
    Category    string    `json:"category"`
    CreatedAt   time.Time `json:"created_at"`
    Status      string    `json:"status"`
    Zone        string    `json:"zone"`
    LinkImage   string    `json:"link_image"`
    Reviews     []Review  `json:"reviews,omitempty" gorm:"foreignKey:EventID"`
    User        User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}
```

### Review (Reseña)
```go
type Review struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    UserID    uint      `json:"user_id"`
    PlaceID   *uint     `json:"place_id,omitempty"`
    EventID   *uint     `json:"event_id,omitempty"`
    Rating    int       `json:"rating"`
    Comment   string    `json:"comment"`
    CreatedAt time.Time `json:"created_at"`
    User      User      `json:"user,omitempty" gorm:"foreignKey:UserID"`
}
```

### UserInterest (Interés en Evento)
```go
type UserInterest struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    UserID    uint      `json:"user_id"`
    EventID   uint      `json:"event_id"`
    Active    bool      `json:"active" gorm:"default:true"`
    CreatedAt time.Time `json:"created_at"`
}
```

### PlaceFavorite (Lugar Favorito)
```go
type PlaceFavorite struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    UserID    uint      `json:"user_id"`
    PlaceID   uint      `json:"place_id"`
    Active    bool      `json:"active" gorm:"default:true"`
    CreatedAt time.Time `json:"created_at"`
}
```

## Sistema de Autenticación JWT

### Generación de Token
```go
func GenerateToken(userID uint, roleID uint) (string, error)
```
- Crea un JWT con claims personalizados
- Incluye userID y roleID en el payload
- Tiempo de expiración: 24 horas
- Firma con secreto desde variable de entorno

### Validación de Token
```go
func ValidateToken(tokenString string) (*Claims, error)
```
- Verifica la firma del token
- Extrae los claims (userID, roleID)
- Valida la expiración

### Middleware de Autenticación
```go
func AuthMiddleware() gin.HandlerFunc
```
- Extrae el token del header `Authorization: Bearer <token>`
- Valida el token
- Inyecta `userID` en el contexto de Gin
- Protege rutas que requieren autenticación

## Endpoints de la API

### Autenticación

#### POST /users/register
Registra un nuevo usuario
```json
Request:
{
  "name": "Juan Pérez",
  "username": "juanp",
  "password": "password123",
  "email": "juan@example.com",
  "age": 25
}

Response:
{
  "message": "Usuario registrado exitosamente",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /users/login
Inicia sesión
```json
Request:
{
  "username": "juanp",
  "password": "password123"
}

Response:
{
  "message": "Login exitoso",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Lugares (Places)

#### GET /places
Obtiene todos los lugares activos
- Query params: `q` (búsqueda por nombre)
- Precarga: Reviews

#### POST /places (requiere auth)
Crea un nuevo lugar
```json
{
  "name": "Plaza Murillo",
  "description": "Plaza histórica",
  "location": "Centro, La Paz",
  "latitude": -16.5,
  "longitude": -68.15,
  "category": "Histórico",
  "link_image": "https://..."
}
```

#### PUT /places/:id (requiere auth)
Actualiza un lugar existente

#### DELETE /places/:id (requiere auth)
Elimina un lugar (soft delete - marca `active = false`)

### Eventos (Events)

#### GET /events
Obtiene todos los eventos
- Precarga: Reviews

#### POST /events (requiere auth)
Crea un nuevo evento

#### PUT /events/:id (requiere auth)
Actualiza un evento existente

#### DELETE /events/:id (requiere auth)
Elimina un evento

### Intereses de Usuario

#### GET /users/:id/interests (requiere auth)
Obtiene los intereses del usuario (eventos marcados)

#### POST /users/:id/interests (requiere auth)
Marca interés en un evento
```json
{
  "event_id": 5
}
```

#### DELETE /users/:id/interests/:eventId (requiere auth)
Quita interés de un evento (soft delete)

### Favoritos de Lugares

#### GET /users/:id/favorites (requiere auth)
Obtiene los lugares favoritos del usuario

#### POST /users/:id/favorites (requiere auth)
Marca un lugar como favorito
```json
{
  "place_id": 12
}
```

#### DELETE /users/:id/favorites/:placeId (requiere auth)
Quita un lugar de favoritos (soft delete)

### IA (Integración con sistema de IA)

#### POST /ia/prompt (requiere auth)
Envía un prompt al sistema de IA
```json
{
  "prompt": "¿Qué lugares puedo visitar?"
}
```

Response: Stream de texto (Server-Sent Events)

## Middleware

### CORS Middleware
```go
func CORSMiddleware() gin.HandlerFunc
```
- Permite peticiones desde cualquier origen (`*`)
- Headers permitidos: `Content-Type`, `Authorization`
- Métodos permitidos: GET, POST, PUT, DELETE, OPTIONS
- Maneja peticiones OPTIONS (preflight)

### Auth Middleware
```go
func AuthMiddleware() gin.HandlerFunc
```
- Verifica presencia del token JWT
- Valida el token
- Extrae userID y lo inyecta en el contexto
- Devuelve 401 si el token es inválido

## Configuración de la Base de Datos

### Conexión
```go
dsn := os.Getenv("DATABASE_URL")
db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
    Logger: logger.Default.LogMode(logger.Info),
})
```

### Variables de Entorno Requeridas
- `DATABASE_URL`: String de conexión a PostgreSQL
- `JWT_SECRET`: Secreto para firma de JWT
- `PORT`: Puerto del servidor (default: 8081)

### Logging de SQL
- Nivel: INFO
- Muestra consultas SQL ejecutadas
- Útil para debugging y optimización

### Slow Query Detection
GORM está configurado para detectar consultas lentas (>200ms):
```
SLOW SQL >= 200ms
[562.069ms] [rows:1] INSERT INTO "places" ...
```

## Características de Seguridad

### Protección de Contraseñas
- Las contraseñas se hashean antes de almacenar
- Tag JSON `json:"-"` previene exposición en respuestas

### Validación de Tokens
- Verificación de firma
- Verificación de expiración
- Manejo de tokens malformados

### Control de Acceso
- Middleware de autenticación en rutas protegidas
- Validación de `userID` en operaciones sensibles
- Verificación de rol para operaciones administrativas

### Soft Delete
- Los lugares usan soft delete (`active = false`)
- Los intereses y favoritos usan soft delete
- Permite recuperación de datos si es necesario

## Integración con Sistema de IA

El backend actúa como proxy entre el frontend y el sistema de IA:

### Flujo
1. Frontend envía prompt con token JWT
2. Backend extrae userID del token
3. Backend consulta intereses del usuario en DB
4. Backend envía prompt + contexto al sistema de IA (Node.js)
5. Sistema de IA responde con stream
6. Backend reenvía el stream al frontend

### Endpoint
```go
POST /ia/prompt
Headers: Authorization: Bearer <token>
Body: { "prompt": "..." }
```

## Optimizaciones y Buenas Prácticas

### Precarga de Relaciones
```go
db.Preload("Reviews").Find(&places)
```
- Reduce consultas N+1
- Mejora rendimiento en endpoints con relaciones

### Paginación
Actualmente no implementada, pero recomendada para:
- Lista de eventos (actualmente 50 items)
- Lista de lugares (actualmente ~52 items)

### Índices Recomendados
Para mejorar rendimiento de consultas:
```sql
CREATE INDEX idx_places_active ON places(active);
CREATE INDEX idx_places_name ON places(name);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_user_interests_user_id ON user_event_favorites(user_id);
```

### Cacheo
- Frontend implementa cache de 5 minutos
- Backend podría implementar cache con Redis para mejor rendimiento

## Manejo de Errores

### Respuestas de Error Estándar
```json
{
  "error": "Mensaje de error descriptivo"
}
```

### Códigos HTTP
- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: Token inválido o ausente
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

## Deployment

### Puerto
- Default: 8081
- Configurable vía variable de entorno `PORT`

### Proxy Reverso
- Caddy configurado como proxy reverso
- Dominio: culturistas.stuns.org
- HTTPS automático con Let's Encrypt

### Health Check
Endpoint para verificar estado del servidor:
```
GET /
Response: "Hello, World!"
```

## Logging y Debugging

### GORM Logging
```
[1618.580ms] [rows:50] SELECT * FROM "events"
```
- Tiempo de ejecución
- Número de filas
- Query SQL completa

### Request Logging
```
[GIN] 2025/10/14 - 03:01:04 | 201 | 562.5805ms | 181.114.68.66 | POST /places
```
- Timestamp
- Código de respuesta
- Tiempo de respuesta
- IP del cliente
- Método y ruta