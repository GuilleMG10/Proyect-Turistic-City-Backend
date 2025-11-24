import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { Plus } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ErrorBanner from "../components/ui/ErrorBanner";
import { useUserStore } from "../store/userStore";
import FilterModal from "../components/modals/FilterModal";
import SearchBar from "../components/ui/SearchBar";
import CategoryChips from "../components/ui/CategoryChips";
import LiveRegion from "../components/ui/LiveRegion";
import { useDataLoading } from "../hooks/useDataLoading";
import { useFiltering } from "../hooks/useFiltering";
import { useModalState } from "../hooks/useModalState";
import { useEventInterest } from "../hooks/useEventInterest";
import { useFavorites } from "../hooks/useFavorites";
import PlaceFormModal from "../components/modals/PlaceFormModal";
import EventFormModal from "../components/modals/EventFormModal";
import type { ExploreContextType } from "./explore/types";

// Lazy load modal components
const EventDetailsModal = lazy(() => import("../components/modals/EventDetailsModal"));
const PlaceDetailsModal = lazy(() => import("../components/modals/PlaceDetailsModal"));

type TabType = 'explorar' | 'eventos' | 'para-ti' | 'calendario' | 'mapa' | 'itinerario';

export default function Explore() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = (pathname: string): TabType => {
    if (pathname.includes('/events')) return 'eventos';
    if (pathname.includes('/for-you')) return 'para-ti';
    if (pathname.includes('/calendar')) return 'calendario';
    if (pathname.includes('/map')) return 'mapa';
    if (pathname.includes('/itinerary')) return 'itinerario';
    return 'explorar';
  };

  const activeTab = getActiveTab(location.pathname);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  // Store last selected category per tab
  const [categoryMemory, setCategoryMemory] = useState<Record<string, string>>({
    explorar: 'Todos',
    eventos: 'Todos'
  });
  const [isPlaceFormOpen, setIsPlaceFormOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
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
  useEffect(() => {
    const tabKey = activeTab === 'explorar' || activeTab === 'para-ti' ? 'explorar' : 'eventos';
    const rememberedCategory = categoryMemory[tabKey];
    
    if (availableCategories.includes(rememberedCategory)) {
      setSelectedCategory(rememberedCategory);
    } else {
      setSelectedCategory('Todos');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, availableCategories]);

  // Save category selection to memory when it changes
  useEffect(() => {
    const tabKey = activeTab === 'explorar' || activeTab === 'para-ti' ? 'explorar' : 'eventos';
    setCategoryMemory(prev => ({
      ...prev,
      [tabKey]: selectedCategory
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const modalState = useModalState();
  const { toggleInterest: toggleEventInterest } = useEventInterest();
  const toggleFavorite = useFavorites((state) => state.toggleFavorite);
  const { user } = useUserStore();
  const isAdmin = useUserStore((state) => state.isAdmin());

  // Listen for place number clicks to navigate to map
  useEffect(() => {
    const handleNavigateToMap = (event: globalThis.Event) => {
      const customEvent = event as CustomEvent<{ placeId: number; displayNumber: number; latitude: number; longitude: number }>;
      const { latitude, longitude } = customEvent.detail;
      navigate('/explore/map', { state: { center: [latitude, longitude] } });
    };

    window.addEventListener('navigateToMapWithPlace', handleNavigateToMap);
    return () => {
      window.removeEventListener('navigateToMapWithPlace', handleNavigateToMap);
    };
  }, [navigate]);

  const liveMessage = useMemo(() => {
    if (loading) return 'Cargando contenido...';
    if (error) return 'Error al cargar el contenido. Por favor, intenta de nuevo.';
    if (searchQuery) return `Búsqueda aplicada: ${searchQuery}`;
    if (selectedCategory !== 'Todos') return `Categoría seleccionada: ${selectedCategory}`;
    
    const tabNames = {
      'explorar': 'lugares',
      'eventos': 'eventos',
      'para-ti': 'recomendaciones',
      'calendario': 'calendario',
      'mapa': 'mapa',
      'itinerario': 'itinerarios'
    };

    const itemCount = activeTab === 'explorar' || activeTab === 'para-ti'
      ? filteredPlaces.length
      : filteredEvents.length;

    return `Mostrando ${itemCount} ${tabNames[activeTab]} en la pestaña ${tabNames[activeTab]}.`;
  }, [loading, error, searchQuery, selectedCategory, activeTab, filteredPlaces.length, filteredEvents.length]);
  
  const handleFormSuccess = () => {
    refetch();
    setIsPlaceFormOpen(false);
    setIsEventFormOpen(false);
  };

  useEffect(() => {
    const isAnyModalOpen = 
      modalState.isEventModalOpen || 
      modalState.isPlaceModalOpen || 
      isPlaceFormOpen || 
      isEventFormOpen || 
      modalState.isFilterModalOpen;
    
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalState.isEventModalOpen, modalState.isPlaceModalOpen, isPlaceFormOpen, isEventFormOpen, modalState.isFilterModalOpen]);

  const contextValue: ExploreContextType = {
    places,
    events,
    filteredPlaces,
    filteredEvents,
    loading,
    user,
    toggleFavorite,
    toggleEventInterest,
    openPlaceModal: modalState.openPlaceModal,
    openEventModal: modalState.openEventModal
  };

  return (
    <>
      <section className="space-y-6">
        {error && <ErrorBanner message={error} />}

        {/* Search & Filters Area */}
        <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onOpenFilters={modalState.openFilterModal}
          />

          {(activeTab === 'explorar' || activeTab === 'eventos') && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <CategoryChips
                categories={availableCategories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />
            </div>
          )}
        </div>

        <section className="tab-content" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          <Outlet context={contextValue} />
        </section>

        <LiveRegion message={liveMessage} priority="polite" />
      </section>

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

      <FilterModal
        isOpen={modalState.isFilterModalOpen}
        onClose={modalState.closeFilterModal}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          console.log('Applied filters:', newFilters);
        }}
        currentFilters={filters}
      />

      {/* Floating Action Button for Creation */}
      {isAdmin && (activeTab === 'explorar' || activeTab === 'eventos') && (
        <button
          onClick={() => activeTab === 'explorar' ? setIsPlaceFormOpen(true) : setIsEventFormOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label={`Crear nuevo ${activeTab === 'explorar' ? 'lugar' : 'evento'}`}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </>
  );
}
