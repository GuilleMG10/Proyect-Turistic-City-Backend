import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { Plus } from "lucide-react";
import PlaceGrid from "../components/PlaceGrid";
import ErrorBanner from "../components/ErrorBanner";
import Calendar from "../components/Calendar";
import Favorites from "../components/Favorites";
import EventCard from "../components/EventCard";
import { useUserStore } from "../store/userStore";
import FilterModal from "../components/FilterModal";
import SearchBar from "../components/SearchBar";
import CategoryChips from "../components/CategoryChips";
import TabNavigation from "../components/TabNavigation";
import LoadingGrid from "../components/LoadingGrid";
import LiveRegion from "../components/LiveRegion";
import { useDataLoading } from "../hooks/useDataLoading";
import { useFiltering } from "../hooks/useFiltering";
import { useModalState } from "../hooks/useModalState";
import { useEventInterest } from "../hooks/useEventInterest";
import { useFavorites } from "../hooks/useFavorites";
import PlaceFormModal from "../components/PlaceFormModal";
import EventFormModal from "../components/EventFormModal";
import MapView from "../components/MapView";
import type { Place, Event } from "../types";
import { getEventStatus } from "../services/api";

// Lazy load modal components
const EventDetailsModal = lazy(() => import("../components/EventDetailsModal"));
const PlaceDetailsModal = lazy(() => import("../components/PlaceDetailsModal"));

type TabType = 'explorar' | 'eventos' | 'para-ti' | 'calendario' | 'mapa';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('explorar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  // Store last selected category per tab
  const [categoryMemory, setCategoryMemory] = useState<Record<string, string>>({
    explorar: 'Todos',
    eventos: 'Todos'
  });
  const [isPlaceFormOpen, setIsPlaceFormOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [showPlacesOnMap, setShowPlacesOnMap] = useState(true);
  const [showEventsOnMap, setShowEventsOnMap] = useState(true);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 1000] as [number, number],
    ageRange: [0, 100] as [number, number],
    minRating: 0,
    zones: [] as string[]
  });

  const { places, events, loading, error, refetch } = useDataLoading();

  const { filteredPlaces, filteredEvents, availableCategories } = useFiltering(
    places,
    events,
    searchQuery,
    selectedCategory,
    activeTab,
    filters
  );

  // Restore last selected category when switching tabs
  // This setState in effect is INTENTIONAL and CORRECT - it synchronizes selectedCategory
  // with the user's previous selection when switching tabs (controlled state synchronization)
  useEffect(() => {
    const tabKey = activeTab === 'explorar' || activeTab === 'para-ti' ? 'explorar' : 'eventos';
    const rememberedCategory = categoryMemory[tabKey];
    
    // If the remembered category exists in this tab, restore it
    if (availableCategories.includes(rememberedCategory)) {
      setSelectedCategory(rememberedCategory);
    } else {
      // Otherwise default to 'Todos'
      setSelectedCategory('Todos');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, availableCategories]);

  // Save category selection to memory when it changes
  // This setState in effect is INTENTIONAL - it's a side effect (caching user preference)
  // that should happen when selectedCategory changes, not derivable state
  useEffect(() => {
    const tabKey = activeTab === 'explorar' || activeTab === 'para-ti' ? 'explorar' : 'eventos';
    setCategoryMemory(prev => ({
      ...prev,
      [tabKey]: selectedCategory
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // Derive live message for screen readers (no setState needed)
  const liveMessage = useMemo(() => {
    if (loading) {
      return 'Cargando contenido...';
    }
    if (error) {
      return 'Error al cargar el contenido. Por favor, intenta de nuevo.';
    }
    if (searchQuery) {
      return `Búsqueda aplicada: ${searchQuery}`;
    }
    if (selectedCategory !== 'Todos') {
      return `Categoría seleccionada: ${selectedCategory}`;
    }
    
    const tabNames = {
      'explorar': 'lugares',
      'eventos': 'eventos',
      'para-ti': 'recomendaciones',
      'calendario': 'calendario',
      'mapa': 'mapa'
    };

    const itemCount = activeTab === 'explorar' || activeTab === 'para-ti'
      ? filteredPlaces.length
      : filteredEvents.length;

    return `Mostrando ${itemCount} ${tabNames[activeTab]} en la pestaña ${tabNames[activeTab]}.`;
  }, [loading, error, searchQuery, selectedCategory, activeTab, filteredPlaces.length, filteredEvents.length]);

  const modalState = useModalState();
  const { toggleInterest: toggleEventInterest } = useEventInterest();
  const toggleFavorite = useFavorites((state) => state.toggleFavorite);
  const { user } = useUserStore();
  const isAdmin = useUserStore((state) => state.isAdmin());
  
  const handleFormSuccess = () => {
    // Refetch to ensure we have the latest data from backend
    refetch();
    setIsPlaceFormOpen(false);
    setIsEventFormOpen(false);
  };

  const handleMapMarkerClick = (item: Place | Event, type: 'place' | 'event') => {
    if (type === 'place') {
      modalState.openPlaceModal(item as Place);
    } else {
      const event = item as Event;
      modalState.openEventModal({
        ...event,
        status: getEventStatus(event.event_date)
      });
    }
  };

  const tabs = [
    { key: 'explorar' as const, label: 'Explorar' },
    { key: 'eventos' as const, label: 'Eventos' },
    { key: 'para-ti' as const, label: 'Para ti' },
    { key: 'calendario' as const, label: 'Calendario' },
    { key: 'mapa' as const, label: 'Mapa' }
  ];

  const renderTabContent = () => {
    if (loading) {
      return <LoadingGrid count={6} />;
    }

    switch (activeTab) {
      case 'explorar':
        return (
          <section aria-labelledby="explorar-heading">
            <h2 id="explorar-heading" className="sr-only">Explorar Lugares</h2>
            <PlaceGrid
              places={filteredPlaces}
              onInterest={(p) => user && toggleFavorite(user.id, p.id)}
              onView={modalState.openPlaceModal}
            />
          </section>
        );

      case 'eventos':
        return (
          <section aria-labelledby="eventos-heading">
            <h2 id="eventos-heading" className="sr-only">Eventos Disponibles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onInterest={() => toggleEventInterest(event)}
                  onView={modalState.openEventModal}
                />
              ))}
            </div>
          </section>
        );

      case 'para-ti':
        return (
          <section aria-labelledby="recomendaciones-heading">
            <h2 id="recomendaciones-heading" className="sr-only">Recomendaciones Personalizadas</h2>
            <Favorites
              events={events}
              places={places}
              onEventView={modalState.openEventModal}
              onEventInterest={toggleEventInterest}
              onPlaceView={modalState.openPlaceModal}
              onPlaceInterest={(p) => user && toggleFavorite(user.id, p.id)}
            />
          </section>
        );

      case 'calendario':
        return (
          <section aria-labelledby="calendario-heading">
            <h2 id="calendario-heading" className="sr-only">Calendario de Eventos</h2>
            <Calendar
              events={events}
              onEventView={modalState.openEventModal}
              onCreateEvent={(date) => console.log("Crear evento en:", date)}
            />
          </section>
        );

      case 'mapa':
        return (
          <section aria-labelledby="mapa-heading" className="space-y-4">
            <h2 id="mapa-heading" className="sr-only">Mapa de Lugares y Eventos</h2>
            
            {/* Map Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Mostrar:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPlacesOnMap}
                  onChange={(e) => setShowPlacesOnMap(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Lugares ({filteredPlaces.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEventsOnMap}
                  onChange={(e) => setShowEventsOnMap(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Eventos ({filteredEvents.length})</span>
              </label>
            </div>

            {/* Map Container */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden relative" style={{ height: '600px', zIndex: 1 }}>
              <MapView
                places={filteredPlaces}
                events={filteredEvents}
                showPlaces={showPlacesOnMap}
                showEvents={showEventsOnMap}
                onMarkerClick={handleMapMarkerClick}
              />
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <section className="space-y-6">
        {error && <ErrorBanner message={error} />}

        {/* Buscar + Filtros */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onOpenFilters={modalState.openFilterModal}
        />

        {/* Chips de categorías - Only show for explorar and eventos tabs */}
        {(activeTab === 'explorar' || activeTab === 'eventos') && (
          <CategoryChips
            categories={availableCategories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        )}

        {/* Tabs with Admin Create Button */}
        <div className="flex items-center justify-between gap-4">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          {isAdmin && (activeTab === 'explorar' || activeTab === 'eventos') && (
            <button
              onClick={() => activeTab === 'explorar' ? setIsPlaceFormOpen(true) : setIsEventFormOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-3 md:px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shrink-0"
              aria-label={`Crear nuevo ${activeTab === 'explorar' ? 'lugar' : 'evento'}`}
            >
              <Plus className="h-5 w-5" />
              <span className="hidden md:inline">Crear {activeTab === 'explorar' ? 'Lugar' : 'Evento'}</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <section className="tab-content" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {renderTabContent()}
        </section>

        {/* Live region for screen reader announcements */}
        <LiveRegion message={liveMessage} priority="polite" />
      </section>

      {/* Modals - Outside space-y-6 to avoid margin issues */}
      <Suspense fallback={null}>
        {modalState.selectedEvent && (
          <EventDetailsModal
            event={modalState.selectedEvent}
            isOpen={modalState.isEventModalOpen}
            onClose={modalState.closeEventModal}
            onUpdate={refetch}
          />
        )}

        {modalState.selectedPlace && (
          <PlaceDetailsModal
            place={modalState.selectedPlace}
            isOpen={modalState.isPlaceModalOpen}
            onClose={modalState.closePlaceModal}
            onUpdate={refetch}
          />
        )}
      </Suspense>

      {/* Admin Forms */}
      <PlaceFormModal
        isOpen={isPlaceFormOpen}
        onClose={() => setIsPlaceFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <EventFormModal
        isOpen={isEventFormOpen}
        onClose={() => setIsEventFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={modalState.isFilterModalOpen}
        onClose={modalState.closeFilterModal}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          // Apply additional filtering logic here if needed
          console.log('Applied filters:', newFilters);
        }}
        currentFilters={filters}
      />
    </>
  );
}
