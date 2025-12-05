# Frontend React - Documentación Técnica

**Última actualización:** Diciembre 2025

## Tecnologías Principales

- **React 19**: Framework de interfaz de usuario
- **TypeScript**: Tipado estático para mayor robustez
- **Vite**: Herramienta de construcción rápida
- **Tailwind CSS**: Framework de estilos utilitarios
- **React Router**: Navegación entre páginas
- **Zustand**: Gestión de estado global
- **Lucide React**: Biblioteca de iconos
- **React Markdown**: Renderizado de Markdown

## Estructura del Proyecto

```
frontend/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── cards/          # Tarjetas (PlaceCard, EventCard)
│   │   ├── features/       # Funcionalidades (AIChat, Calendar)
│   │   ├── Itinerary/      # Componentes de itinerarios
│   │   └── modals/         # Modales (Login, Detalles, Formularios)
│   ├── hooks/              # Hooks personalizados
│   ├── routes/             # Páginas/Rutas
│   │   ├── Home.tsx        # Página principal
│   │   ├── Profile.tsx     # Perfil de usuario
│   │   └── explore/        # Explorar lugares y eventos
│   ├── services/           # Servicios de API
│   ├── store/              # Estado global (Zustand)
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Utilidades
│   ├── App.tsx             # Componente raíz
│   └── main.tsx            # Punto de entrada
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Componentes Principales

### App.tsx
Componente raíz que estructura la aplicación:
- **Header**: Navegación con título y menú de usuario
- **Main**: Área donde se renderizan las rutas
- **Modales**: Login y Chat de IA (cargados de forma lazy)
- **Skip Links**: Accesibilidad para navegación por teclado

### AIChat.tsx
Chat interactivo con el asistente de IA:

**Características:**
- Streaming en tiempo real (Server-Sent Events)
- Soporte para modelo rápido y modelo razonador
- Visualización del proceso de "pensamiento" del modelo
- Adjuntar imágenes (si el modelo de visión está disponible)
- Formato Markdown en respuestas
- Modal arrastrable en móvil
- Auto-colapso de sección de razonamiento al completar

**Detección de Capacidades:**
```typescript
// El frontend consulta las capacidades del proveedor de IA
const response = await fetch(`${API_BASE_URL}/ia/capabilities`);
// { provider: "ollama", capabilities: { vision: false, thinking: true } }

// Condiciona la UI basándose en las capacidades:
{capabilities?.capabilities.thinking && (
  <button>Modelo razonador</button>
)}
{capabilities?.capabilities.vision && (
  <button>Adjuntar imagen</button>
)}
```

**Flujo de Mensajes:**
1. Usuario escribe mensaje
2. Se envía a `/ia/prompt` con token JWT
3. Backend Go enriquece con contexto del usuario
4. Asistente Node.js procesa con Ollama
5. Respuesta llega en streaming
6. Frontend renderiza en tiempo real

### Componentes de Itinerario

**ItineraryTab.tsx**: Pestaña principal de itinerarios
- Lista de itinerarios del usuario
- Botón para generar nuevo itinerario con IA
- Modal de generación con:
  - Selector de fecha
  - Horario de inicio y fin
  - Presupuesto aproximado
  - Ritmo del tour (Relajado/Moderado/Intenso)
  - Preferencias de categorías

**ItineraryEditModal.tsx**: Editor de itinerarios
- Agregar/eliminar paradas
- Reordenar visitas
- Editar notas y horarios

## Hooks Personalizados

### useDataLoading
Carga datos de lugares y eventos:
```typescript
const { places, events, isLoading, error, refetch } = useDataLoading();
```
- Cache inteligente de 5 minutos
- Limpieza de cache después de mutaciones
- Recarga automática de favoritos e intereses del usuario

### useFiltering
Filtrado de contenido:
```typescript
const { filteredPlaces, filteredEvents, categories } = useFiltering({
  places, events, searchTerm, selectedCategory, filters
});
```
- Búsqueda por texto
- Filtro por categoría (con memoria por pestaña)
- Filtros avanzados: precio, rating mínimo, zona

### useModalState
Gestión de estados de modales:
```typescript
const { 
  isLoginModalOpen, 
  selectedPlace, 
  openPlaceDetails 
} = useModalState();
```

### useFavorites / useEventInterest
Gestión de favoritos y eventos de interés:
```typescript
const { isFavorite, toggleFavorite } = useFavorites(placeId);
const { hasInterest, toggleInterest } = useEventInterest(eventId);
```

## Servicios

### ApiService (api.ts)
Servicio centralizado para llamadas a la API:

```typescript
class ApiService {
  // Lugares
  static getPlaces(): Promise<Place[]>
  static createPlace(place: Partial<Place>): Promise<Place>
  static updatePlace(id: number, place: Partial<Place>): Promise<Place>
  static deletePlace(id: number): Promise<void>
  
  // Eventos
  static getEvents(): Promise<Event[]>
  static createEvent(event: Partial<Event>): Promise<Event>
  
  // Autenticación
  static login(credentials): Promise<{ user, token }>
  static register(userData): Promise<{ user, token }>
  
  // Favoritos e intereses
  static getFavorites(userId): Promise<PlaceFavorite[]>
  static addFavorite(userId, placeId): Promise<void>
  static removeFavorite(userId, placeId): Promise<void>
  
  // Itinerarios
  static getItineraries(): Promise<Itinerary[]>
  static createItinerary(itinerary): Promise<Itinerary>
  static deleteItinerary(id): Promise<void>
}
```

**Cache Inteligente:**
- Respuestas cacheadas por 5 minutos
- Limpieza automática después de crear/editar/eliminar
- Método `clearCache()` para forzar recarga

### ItineraryService (itineraryService.ts)
Generación de itinerarios con IA:

```typescript
class ItineraryService {
  static async generateItinerary(
    request: ItineraryGenerateRequest,
    onProgress?: (text: string) => void
  ): Promise<GeneratedItinerary>
}
```

**Flujo de Generación:**
1. Obtiene lugares y eventos disponibles
2. Filtra por preferencias del usuario
3. Construye prompt estructurado para el modelo
4. Envía a `/ia/prompt` con `skipMemory: true`
5. Parsea respuesta JSON del modelo
6. Valida y enriquece items con datos reales

## Gestión de Estado (Zustand)

### userStore.ts
```typescript
interface UserState {
  user: User | null;
  token: string | null;
  favorites: PlaceFavorite[];
  interests: UserInterest[];
  
  login(credentials): Promise<void>;
  register(userData): Promise<void>;
  logout(): void;
  isAdmin(): boolean;  // role_id === 1
}
```

**Persistencia:**
- Almacenado en localStorage
- Token JWT renovado en cada login
- Favoritos e intereses sincronizados

## Tipos TypeScript

### Principales
```typescript
type Place = {
  id: number;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  price: number;
  link_image: string;
  active: boolean;
  reviews?: Review[];
};

type Event = {
  id: number;
  name: string;
  description: string;
  event_date: string;
  location: string;
  price: number;
  category: string;
  reviews?: Review[];
};

type Itinerary = {
  id: number;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  items?: ItineraryItem[];
};

type AICapabilities = {
  provider: string;
  model: string;
  capabilities: {
    vision: boolean;
    thinking: boolean;
  };
};
```

## Funcionalidades de Usuario

### Chat con IA
- **Modelo Rápido**: Respuestas instantáneas
- **Modelo Razonador**: Muestra proceso de pensamiento
- **Adjuntar Imágenes**: Análisis visual (si disponible)
- **Sugerencias Predefinidas**: Preguntas frecuentes
- **Historial de Chat**: Por sesión (no persistente)

### Exploración
- **Lugares**: Galería con filtros por categoría
- **Eventos**: Lista con estados (próximo, en vivo, terminado)
- **Búsqueda**: Por nombre y descripción
- **Favoritos**: Guardado por usuario

### Itinerarios
- **Generación con IA**: Basada en preferencias
- **Personalización**: Edición manual después de generar
- **Guardado**: Persistente en base de datos

## Funcionalidades de Administrador

Usuarios con `role_id = 1` tienen acceso a:
- **Crear lugares**: Botón "+" en pestaña Explorar
- **Editar lugares**: En modal de detalles
- **Eliminar lugares**: Soft delete con confirmación
- **Gestión de eventos**: Crear, editar, eliminar

## Accesibilidad

- **Skip Links**: Navegación rápida por teclado
- **ARIA Labels**: Etiquetas descriptivas
- **Live Regions**: Anuncios de cambios de contenido
- **Contraste**: Colores con buen contraste
- **Semántica HTML**: Uso correcto de elementos

## Optimizaciones

- **Lazy Loading**: Componentes pesados cargados bajo demanda
- **Cache de API**: Respuestas cacheadas 5 minutos
- **Debounce**: Búsqueda con retardo para evitar llamadas excesivas
- **Suspense**: Fallbacks durante carga
- **Imágenes**: Placeholders con iniciales, fallbacks automáticos

## Variables de Entorno

```env
VITE_API_URL=http://localhost:8081
```

## Comandos

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run preview

# Linting
npm run lint
```

## Estilos

Tailwind CSS con tema personalizado:
- **Modo oscuro**: Soporte completo (`dark:`)
- **Colores primarios**: Cyan/Blue para acciones principales
- **Componentes**: Botones, tarjetas, modales consistentes
- **Responsive**: Mobile-first design
