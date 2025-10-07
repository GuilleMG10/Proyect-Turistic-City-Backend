import { useState, useEffect, Suspense, lazy } from "react";
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

// Lazy load modal components
const EventDetailsModal = lazy(() => import("../components/EventDetailsModal"));
const PlaceDetailsModal = lazy(() => import("../components/PlaceDetailsModal"));

type TabType = 'explorar' | 'eventos' | 'para-ti' | 'calendario';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('explorar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [liveMessage, setLiveMessage] = useState('');
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 1000] as [number, number],
    ageRange: [0, 100] as [number, number],
    minRating: 0,
    zones: [] as string[]
  });

  const { places, events, loading, error } = useDataLoading();

  const { filteredPlaces, filteredEvents, availableCategories } = useFiltering(
    places,
    events,
    searchQuery,
    selectedCategory,
    activeTab,
    filters
  );

  // Announce content changes to screen readers
  useEffect(() => {
    if (loading) {
      setLiveMessage('Cargando contenido...');
    } else if (error) {
      setLiveMessage('Error al cargar el contenido. Por favor, intenta de nuevo.');
    } else {
      const tabNames = {
        'explorar': 'lugares',
        'eventos': 'eventos',
        'para-ti': 'recomendaciones',
        'calendario': 'calendario'
      };

      const itemCount = activeTab === 'explorar' || activeTab === 'para-ti'
        ? filteredPlaces.length
        : filteredEvents.length;

      setLiveMessage(`Mostrando ${itemCount} ${tabNames[activeTab]} en la pestaña ${tabNames[activeTab]}.`);
    }
  }, [loading, error, activeTab, filteredPlaces.length, filteredEvents.length]);

  // Announce filter changes
  useEffect(() => {
    if (searchQuery) {
      setLiveMessage(`Búsqueda aplicada: ${searchQuery}`);
    } else if (selectedCategory !== 'Todos') {
      setLiveMessage(`Categoría seleccionada: ${selectedCategory}`);
    }
  }, [searchQuery, selectedCategory]);

  const modalState = useModalState();
  const { toggleInterest: toggleEventInterest } = useEventInterest();
  const toggleFavorite = useFavorites((state) => state.toggleFavorite);
  const { user } = useUserStore();
  const tabs = [
    { key: 'explorar' as const, label: 'Explorar' },
    { key: 'eventos' as const, label: 'Eventos' },
    { key: 'para-ti' as const, label: 'Para ti' },
    { key: 'calendario' as const, label: 'Calendario' }
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
              onEventInterest={(e) => toggleEventInterest(e)}
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

      default:
        return null;
    }
  };

  return (
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

      {/* Tabs */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <section className="tab-content" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {renderTabContent()}
      </section>

      {/* Modals */}
      <Suspense fallback={null}>
        {modalState.selectedEvent && (
          <EventDetailsModal
            event={modalState.selectedEvent}
            isOpen={modalState.isEventModalOpen}
            onClose={modalState.closeEventModal}
          />
        )}

        {modalState.selectedPlace && (
          <PlaceDetailsModal
            place={modalState.selectedPlace}
            isOpen={modalState.isPlaceModalOpen}
            onClose={modalState.closePlaceModal}
          />
        )}
      </Suspense>

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
        availableCategories={availableCategories.filter(c => c !== 'Todos')}
      />

      {/* Live region for screen reader announcements */}
      <LiveRegion message={liveMessage} priority="polite" />
    </section>
  );
}
