# Backend Go - Documentación Técnica

**Última actualización:** Diciembre 2025

## Tecnologías Principales

- **Go 1.x**: Lenguaje de programación principal
- **Gin**: Framework web HTTP para APIs REST
- **GORM**: ORM para interacción con base de datos PostgreSQL
- **JWT**: Autenticación basada en tokens
- **PostgreSQL (Supabase)**: Base de datos relacional en la nube
- **CORS**: Middleware para peticiones cross-origin

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
│       ├── user_preference_handler.go
│       ├── itinerary_handler.go
│       └── ia_handler.go
├── auth/
│   └── jwt.go               # Generación y validación de JWT
├── middleware/
│   ├── auth.go              # Middleware de autenticación
│   ├── admin.go             # Middleware de autorización admin
│   ├── login_limiter.go     # Rate limiting para login
│   └── cors.go              # Middleware de CORS
├── model/
│   ├── event.go             # Modelo de eventos
│   ├── place.go             # Modelo de lugares
│   ├── user.go              # Modelo de usuarios
│   ├── review.go            # Modelo de reseñas
│   ├── user_interest.go     # Modelo de intereses en eventos
│   ├── place_favorite.go    # Modelo de favoritos de lugares
│   ├── user_preference.go   # Modelo de preferencias de categoría
│   └── itinerary.go         # Modelo de itinerarios
├── repository/
│   └── ...                  # Repositorios para cada modelo
└── service/
    └── ...                  # Servicios de lógica de negocio
```

## Arquitectura en Capas

El backend sigue una arquitectura limpia con separación de responsabilidades:

### 1. Handler (Controlador)
- Recibe peticiones HTTP
- Valida datos de entrada
- Llama a la capa de servicio
- Devuelve respuestas HTTP

### 2. Service (Servicio)
- Lógica de negocio
- Validaciones complejas
- Orquestación entre múltiples repositorios

### 3. Repository (Repositorio)
- Acceso directo a la base de datos
- Operaciones CRUD con GORM
- Gestión de relaciones

### 4. Model (Modelo)
- Estructuras de datos
- Mapeo ORM con tags de GORM

## Modelos de Datos Principales

### User (Usuario)
```go
type User struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    RoleID    uint      `json:"role_id"`    // 1 = Admin, 2 = Usuario normal
    Name      string    `json:"name"`
    Username  string    `json:"username" gorm:"unique"`
    Password  string    `json:"-"`          // Nunca se expone en JSON
    Email     string    `json:"email"`
    Age       int       `json:"age"`
    CreatedAt time.Time `json:"created_at"`
    Active    bool      `json:"active" gorm:"default:true"`
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
    Price       float64   `json:"price"`
    CreatedAt   time.Time `json:"created_at"`
    LinkImage   string    `json:"link_image"`
    Active      bool      `json:"active" gorm:"default:true"`
    Reviews     []Review  `json:"reviews,omitempty" gorm:"foreignKey:PlaceID"`
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
    Latitude    float64   `json:"latitude"`
    Longitude   float64   `json:"longitude"`
    Price       float64   `json:"price"`
    Category    string    `json:"category"`
    CreatedAt   time.Time `json:"created_at"`
    Reviews     []Review  `json:"reviews,omitempty" gorm:"foreignKey:EventID"`
}
```

### Itinerary (Itinerario)
```go
type Itinerary struct {
    ID          uint            `json:"id" gorm:"primaryKey"`
    UserID      uint            `json:"user_id"`
    Name        string          `json:"name"`
    Description string          `json:"description"`
    Date        time.Time       `json:"date"`
    StartTime   string          `json:"start_time"`
    EndTime     string          `json:"end_time"`
    CreatedAt   time.Time       `json:"created_at"`
    Items       []ItineraryItem `json:"items,omitempty" gorm:"foreignKey:ItineraryID"`
}

type ItineraryItem struct {
    ID          uint   `json:"id" gorm:"primaryKey"`
    ItineraryID uint   `json:"itinerary_id"`
    Type        string `json:"type"`       // "place" o "event"
    ItemID      uint   `json:"item_id"`    // ID del lugar o evento
    StartTime   string `json:"start_time"`
    EndTime     string `json:"end_time"`
    Order       int    `json:"order"`
    Notes       string `json:"notes"`
}
```

## Sistema de Autenticación JWT

### Generación de Token
```go
func GenerateToken(userID uint, roleID uint) (string, error)
```
- Crea un JWT con claims personalizados
- Incluye `userID` y `roleID` en el payload
- Tiempo de expiración: 24 horas
- Firma con secreto desde variable de entorno `JWT_SECRET`

### Middleware de Autenticación
```go
func AuthMiddleware() gin.HandlerFunc
```
- Extrae el token del header `Authorization: Bearer <token>`
- Valida la firma y expiración
- Inyecta `userID` en el contexto de Gin

### Middleware de Administrador
```go
func AdminMiddleware() gin.HandlerFunc
```
- Verifica que `roleID == 1`
- Protege rutas de gestión (crear/editar/eliminar lugares y eventos)

## Endpoints de la API

### Rutas Públicas (sin autenticación)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/users/register` | Registro de usuario |
| POST | `/users/login` | Inicio de sesión (con rate limiting) |
| GET | `/places` | Lista de lugares activos |
| GET | `/places/:id/reviews` | Reseñas de un lugar |
| GET | `/events` | Lista de eventos |
| GET | `/ia/capabilities` | Capacidades del sistema IA |

### Rutas Autenticadas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users/:id` | Obtener información de usuario |
| POST | `/ia/prompt` | Chat con asistente IA |
| POST | `/ia/itinerary` | Generar itinerario con IA |
| POST | `/ia/vision` | Análisis de imagen con IA |
| GET/POST/DELETE | `/users/:id/interests` | Gestión de intereses en eventos |
| GET/POST/DELETE | `/users/:id/favorites` | Gestión de lugares favoritos |
| GET/POST/DELETE | `/users/:id/preferences` | Preferencias de categorías |
| GET/POST/PUT/DELETE | `/itineraries` | Gestión de itinerarios |

### Rutas de Administrador

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/places` | Crear lugar |
| PUT | `/places/:id` | Actualizar lugar |
| DELETE | `/places/:id` | Eliminar lugar (soft delete) |
| POST | `/events` | Crear evento |
| PUT | `/events/:id` | Actualizar evento |
| DELETE | `/events/:id` | Eliminar evento |

## Integración con Sistema de IA (Node.js)

El backend Go actúa como proxy entre el frontend y el asistente de IA en Node.js:

### Flujo de Comunicación
```
Frontend (React) 
    → Backend Go (JWT + Contexto) 
    → Asistente IA (Node.js :3500)
    → Ollama LLM
```

### POST /ia/prompt
```go
// Estructura del request
type PromptRequest struct {
    Prompt     string `json:"prompt"`
    Model      string `json:"model"`      // "fast" o "thinking"
    SkipMemory bool   `json:"skipMemory"` // Saltar memoria (para itinerarios)
}

// El handler:
// 1. Extrae userID del JWT
// 2. Obtiene intereses del usuario de la BD
// 3. Reenvía al servicio IA con contexto enriquecido
// 4. Transmite respuesta en streaming (SSE)
```

### POST /ia/vision
- Recibe imagen en base64
- Reenvía al modelo de visión (si está disponible)
- Retorna análisis de la imagen

### GET /ia/capabilities
- Consulta capacidades del proveedor de IA actual
- Retorna: `{ provider, model, capabilities: { vision, thinking } }`
- El frontend usa esto para mostrar/ocultar funciones

## Seguridad

### Protecciones Implementadas

1. **Rate Limiting**: Límite de intentos de login por IP
2. **Timing Attack Prevention**: Retardos aleatorios en errores de login
3. **SQL Injection Prevention**: Consultas parametrizadas con GORM
4. **IDOR Prevention**: Validación de propiedad en recursos de usuario
5. **Soft Delete**: Lugares usan `active = false` en lugar de eliminación física
6. **Password Hashing**: Contraseñas hasheadas con bcrypt

### Configuración CORS
```go
AllowOrigins: "*"
AllowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
AllowHeaders: ["Content-Type", "Authorization"]
```

## Variables de Entorno

```env
# Base de datos (Supabase)
DB_USER=postgres.instancia
DB_PASSWORD=contraseña
DB_HOST=host.supabase.co
DB_PORT=5432
DB_NAME=postgres

# Autenticación
JWT_SECRET=secreto_seguro

# Servidor
PORT=8081
```

## Comandos de Ejecución

```bash
# Desarrollo
go run cmd/backend/main.go

# Producción (compilado)
go build -o server cmd/backend/main.go
./server
```

## Logging y Monitoreo

GORM detecta consultas lentas automáticamente:
```
SLOW SQL >= 200ms
[362.820ms] [rows:4] SELECT * FROM "user_event_favorites" ...
```

Gin registra cada petición HTTP:
```
[GIN] 2025/12/05 - 17:00:06 | 200 | 4m56s | 127.0.0.1 | POST "/ia/prompt"
```
