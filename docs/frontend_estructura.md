# Documentación Frontend

## Tecnologías Principales

- **React 19**: Framework principal para la construcción de la interfaz de usuario.
- **TypeScript**: Proporciona tipado estático para mayor robustez y mantenibilidad del código.
- **Vite**: Herramienta de construcción rápida y servidor de desarrollo.
- **Tailwind CSS**: Framework de CSS para estilos utilitarios y diseño responsivo.
- **React Router**: Manejo de rutas y navegación entre páginas.
- **Zustand**: Gestión de estado global de la aplicación.
- **Supabase**: Base de datos y autenticación en la nube.
- **Lucide React**: Biblioteca de iconos para la interfaz.

## Estructura del Proyecto

```
frontend/
├── public/                 # Archivos estáticos públicos
├── src/
│   ├── components/         # Componentes reutilizables de UI
│   ├── hooks/              # Hooks personalizados de React
│   ├── lib/                # Configuraciones de bibliotecas externas
│   ├── routes/             # Páginas/componentes de rutas
│   ├── services/           # Servicios para llamadas a APIs
│   ├── store/              # Gestión de estado global
│   ├── types/              # Definiciones de tipos TypeScript
│   ├── utils/              # Utilidades y funciones auxiliares
│   ├── App.tsx             # Componente raíz de la aplicación
│   ├── main.tsx            # Punto de entrada de la aplicación
│   └── index.css           # Estilos globales
├── package.json            # Dependencias y scripts del proyecto
├── vite.config.ts          # Configuración de Vite
├── tsconfig.json           # Configuración de TypeScript
└── tailwind.config.js      # Configuración de Tailwind CSS
```

## Archivos de Configuración

### package.json
Define las dependencias del proyecto y scripts disponibles:
- **Dependencias principales**: React, React DOM, React Router, Supabase, Zustand, etc.
- **Dependencias de desarrollo**: TypeScript, ESLint, Vite, Tailwind CSS.
- **Scripts disponibles**:
  - `dev`: Inicia el servidor de desarrollo
  - `build`: Construye la aplicación para producción
  - `lint`: Ejecuta el linter de código

### vite.config.ts
Configura el servidor de desarrollo de Vite:
- Puerto: 5173
- Servidor abierto automáticamente al iniciar
- Configuración CORS para desarrollo
- Optimización de dependencias para React y Supabase

### tsconfig.json
Configuración de TypeScript dividida en referencias:
- `tsconfig.app.json`: Para el código de la aplicación
- `tsconfig.node.json`: Para archivos de configuración de Node.js

## Componentes Principales

### App.tsx
Componente raíz que estructura la aplicación completa:
- **Header**: Navegación principal con título y menú de usuario
- **Main content**: Área principal donde se renderizan las rutas
- **Modales**: Login, AI Chat (cargado de forma lazy)
- **Skip Links**: Enlaces de accesibilidad para navegación por teclado

### main.tsx
Punto de entrada que inicializa React:
- Crea el router con React Router
- Renderiza la aplicación en el elemento `#root`
- Configura React.StrictMode para desarrollo

### Routes/Home.tsx
Página principal que contiene toda la lógica de la aplicación:
- **Estados principales**: Maneja pestañas activas, búsqueda, filtros, categorías
- **Carga de datos**: Usa hooks personalizados para obtener lugares y eventos
- **Filtrado**: Aplica filtros de búsqueda, categoría y otros criterios
- **Accesibilidad**: Anuncia cambios de contenido a lectores de pantalla
- **Modales**: Gestiona apertura/cierre de modales de detalles

## Componentes de UI (src/components/)

### Componentes de Navegación y Layout
- **SkipLinks**: Enlaces de navegación para accesibilidad
- **UserMenu**: Menú desplegable del usuario con opciones de login/logout
- **TabNavigation**: Navegación por pestañas (Explorar, Eventos, Para ti, Calendario)

### Componentes de Contenido
- **PlaceGrid**: Muestra una cuadrícula de lugares turísticos
- **EventGrid**: Muestra una cuadrícula de eventos
- **PlaceCard**: Tarjeta individual para un lugar
- **EventCard**: Tarjeta individual para un evento
- **Calendar**: Vista de calendario para eventos

### Componentes de Interacción
- **SearchBar**: Barra de búsqueda con filtros avanzados
- **CategoryChips**: Chips para filtrar por categorías
- **FilterModal**: Modal con filtros avanzados (precios, edades, zonas)
- **AIChat**: Chat con asistente de IA (cargado de forma lazy)

### Componentes de Estado y Feedback
- **LoadingGrid**: Placeholder mientras carga el contenido
- **EmptyState**: Mensaje cuando no hay contenido que mostrar
- **ErrorBanner**: Banner de error para mostrar problemas
- **LiveRegion**: Región viva para anuncios de accesibilidad

### Modales
- **LoginModal**: Modal de inicio de sesión/registro
- **EventDetailsModal**: Detalles completos de un evento
- **PlaceDetailsModal**: Detalles completos de un lugar

## Hooks Personalizados (src/hooks/)

### useDataLoading.ts
Hook principal para cargar datos de la API:
- Carga lugares y eventos al montar el componente
- Maneja estados de carga y error
- Se integra con el estado del usuario para cargar datos personalizados

### useFiltering.ts
Maneja la lógica de filtrado de contenido:
- Filtra por búsqueda de texto
- Filtra por categoría seleccionada
- Aplica filtros avanzados (precios, edades, zonas)
- Devuelve listas filtradas de lugares y eventos

### useModalState.ts
Gestiona el estado de múltiples modales:
- Estado de apertura/cierre de cada modal
- Datos del elemento seleccionado (evento/lugar)
- Funciones para abrir/cerrar modales

### useEventInterest.ts
Maneja el interés del usuario en eventos:
- Agregar/quitar interés en eventos
- Sincronización con la API

### useFavorites.ts
Gestiona los lugares favoritos del usuario:
- Cargar favoritos desde la API
- Agregar/quitar favoritos
- Sincronización con el estado global

### Otros hooks
- **useDebounce**: Para búsqueda con debounce
- **useFormState**: Para manejo de formularios
- **useRecommendations**: Para lógica de recomendaciones

## Servicios (src/services/)

### api.ts
Servicio principal para llamadas a la API backend:
- **Clase ApiService**: Métodos estáticos para todas las operaciones de API
- **Cache inteligente**: Cache de 5 minutos para evitar llamadas innecesarias
- **Manejo de errores**: Logging y propagación de errores
- **Endpoints disponibles**:
  - Eventos: obtener, crear, obtener por ID
  - Lugares: obtener, crear
  - Usuarios: obtener, crear, login, registro
  - Reseñas: obtener reseñas de lugares
  - Intereses: gestionar intereses en eventos
  - Favoritos: gestionar lugares favoritos

## Gestión de Estado (src/store/)

### userStore.ts
Estado global del usuario usando Zustand:
- **Estado persistente**: Usuario logueado, intereses, favoritos
- **Acciones**: Login, registro, logout
- **Integración**: Se conecta con hooks de favoritos e intereses
- **Persistencia**: Usa localStorage para mantener sesión (por ahora hasta que implementemos JWT)

## Tipos TypeScript (src/types/)

### index.ts
Definiciones de tipos para toda la aplicación:
- **Place**: Lugares turísticos con ubicación, categoría, etc.
- **Event**: Eventos con fecha, precio, categoría
- **User**: Información de usuarios
- **Review**: Reseñas de lugares/eventos
- **UserInterest**: Intereses del usuario en eventos
- **PlaceFavorite**: Lugares favoritos del usuario
- **EventStatus**: Estados de eventos (próximo, en vivo, terminado)

## Utilidades (src/utils/)

### eventStatus.ts
Funciones para determinar el estado de eventos:
- `getEventStatusColor`: Devuelve colores y etiquetas según el estado

### imageUtils.ts (esto desaparecera para el MVP)
Utilidades para manejo de imágenes:
- `getImageSrc`: Maneja URLs de imágenes con fallbacks
- `getPlaceholderImage`: Imágenes placeholder aleatorias
- `handleImageError`: Manejo de errores de carga de imágenes

## Configuraciones Externas (src/lib/)

### supabaseClient.ts
Configuración del cliente de Supabase:
- Conexión a la base de datos en la nube
- Configuración de autenticación persistente
- Variables de entorno requeridas

## Flujo

### Inicio de la Aplicación
1. `main.tsx` crea el router y renderiza `App.tsx`
2. `App.tsx` muestra el layout básico con header y navegación
3. Se carga la ruta principal (`Home.tsx`)

### Carga de Datos
1. `useDataLoading` se ejecuta al montar `Home.tsx`
2. Llama a `ApiService.getEvents()` y `ApiService.getPlaces()`
3. Los datos se almacenan en estado local
4. Si hay usuario logueado, carga intereses y favoritos

### Interacción del Usuario
1. **Navegación por pestañas**: Cambia el contenido mostrado
2. **Búsqueda**: Filtra lugares/eventos por texto
3. **Categorías**: Filtra por chips de categoría
4. **Filtros avanzados**: Modal con filtros detallados
5. **Favoritos**: Agregar/quitar lugares favoritos
6. **Interés en eventos**: Marcar interés en eventos
7. **Detalles**: Abrir modales con información completa

### Chat con IA
1. Usuario hace clic en "AI Assistant"
2. Se abre modal `AIChat` (cargado de forma lazy)
3. Mensajes se envían al backend de IA
4. Respuestas se muestran en tiempo real usando Server-Sent Events

### Autenticación
1. Usuario hace clic en login desde `UserMenu`
2. Se abre `LoginModal` con formulario
3. `userStore.login()` llama a la API
4. Si exitoso, carga datos del usuario y favoritos

## Accesibilidad

- **Skip Links**: Navegación rápida para usuarios de teclado
- **ARIA labels**: Etiquetas descriptivas para lectores de pantalla
- **Live Regions**: Anuncios de cambios de contenido
- **Navegación por teclado**: Todos los elementos interactivos accesibles
- **Contraste de colores**: Colores con buen contraste
- **Semántica HTML**: Uso correcto de elementos semánticos

## Optimizaciones

- **Lazy Loading**: Componentes pesados (AIChat, modales) se cargan bajo demanda
- **Cache de API**: Respuestas de API se cachean por 5 minutos
- **Debounce**: Búsqueda con debounce para evitar llamadas excesivas
- **Suspense**: Manejo de carga de componentes lazy
- **Optimización de imágenes**: Fallbacks y manejo de errores de imágenes