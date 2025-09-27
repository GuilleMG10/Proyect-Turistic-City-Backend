import { useEffect, useState } from "react";
import type { Place, EventWithStatus } from "../types";
import PlaceGrid from "../components/PlaceGrid";
import ErrorBanner from "../components/ErrorBanner";
import Calendar from "../components/Calendar";
import Favorites from "../components/Favorites";
import EventCard from "../components/EventCard";
import EventDetailsModal from "../components/EventDetailsModal";
import PlaceDetailsModal from "../components/PlaceDetailsModal";
import FilterModal from "../components/FilterModal";
import { ApiService } from "../services/api";
import { useUserStore, setTemporaryUser } from "../store/userStore";

type TabType = 'explorar' | 'eventos' | 'para-ti' | 'calendario';

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('explorar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedEvent, setSelectedEvent] = useState<EventWithStatus | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 1000] as [number, number],
    ageRange: [0, 100] as [number, number],
    minRating: 0,
    zones: [] as string[]
  });
  
  const { user } = useUserStore();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        // Initialize temporary user if no user exists
        if (!user) {
          setTemporaryUser();
        }



        // Load events from API
        const eventsData = await ApiService.getEvents();
        if (!cancelled) {
          setEvents(eventsData);
        }

        // Load places from API  
        const placesData = await ApiService.getPlaces();
        if (!cancelled) {
          setPlaces(placesData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (!cancelled) {
          setErr('Error al cargar los datos. Intentando de nuevo...');
        }
      }
      
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Enhanced filtering logic combining search, categories, and advanced filters
  const filteredPlaces = places.filter(place => {
    // Search filter
    const matchesSearch = !searchQuery || 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter (both chip and modal)
    const categoryMatches = selectedCategory === 'Todos' || place.category === selectedCategory;
    const modalCategoryMatches = filters.categories.length === 0 || filters.categories.includes(place.category);
    
    // Note: Places don't have price/rating in our current DB structure, but we can extend this later
    
    return matchesSearch && categoryMatches && modalCategoryMatches;
  });

  const filteredEvents = events.filter(event => {
    // Search filter
    const matchesSearch = !searchQuery || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter (both chip and modal)
    const categoryMatches = selectedCategory === 'Todos' || event.category === selectedCategory;
    const modalCategoryMatches = filters.categories.length === 0 || filters.categories.includes(event.category);
    
    // Price filter
    const priceMatches = event.price >= filters.priceRange[0] && event.price <= filters.priceRange[1];
    
    return matchesSearch && categoryMatches && modalCategoryMatches && priceMatches;
  });

  // Dynamic categories based on current tab
  const getAvailableCategories = () => {
    const allCategories = new Set<string>();
    
    if (activeTab === 'explorar' || activeTab === 'para-ti') {
      // Get categories from places
      places.forEach(place => {
        if (place.category) allCategories.add(place.category);
      });
    } else if (activeTab === 'eventos' || activeTab === 'calendario') {
      // Get categories from events
      events.forEach(event => {
        if (event.category) allCategories.add(event.category);
      });
    }
    
    return ["Todos", ...Array.from(allCategories).sort()];
  };

  const categories = getAvailableCategories();
  const tabs = [
    { key: 'explorar' as const, label: 'Explorar' },
    { key: 'eventos' as const, label: 'Eventos' },
    { key: 'para-ti' as const, label: 'Para ti' },
    { key: 'calendario' as const, label: 'Calendario' }
  ];

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200/70" />
          ))}
        </div>
      );
    }

    switch (activeTab) {
      case 'explorar':
        return (
          <PlaceGrid
            places={filteredPlaces}
            onInterest={(p) => console.log("Me interesa:", p.name)}
            onView={(p) => setSelectedPlace(p)}
          />
        );
      
      case 'eventos':
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onInterest={(e) => console.log("Me interesa evento:", e.name)}
                onView={(e) => setSelectedEvent(e)}
              />
            ))}
          </div>
        );
      
      case 'para-ti':
        return (
          <Favorites
            events={events}
            places={places}
            onEventView={(e) => setSelectedEvent(e)}
            onEventInterest={(e) => console.log("Me interesa evento:", e.name)}
            onPlaceView={(p) => setSelectedPlace(p)}
            onPlaceInterest={(p) => console.log("Me interesa lugar:", p.name)}
          />
        );
      
      case 'calendario':
        return (
          <Calendar
            events={events}
            onEventView={(e) => setSelectedEvent(e)}
            onCreateEvent={(date) => console.log("Crear evento en:", date)}
          />
        );
      
      default:
        return null;
    }
  };

return (
  <section className="space-y-6">
    {err && <ErrorBanner message={err} />}

    {/* Buscar + Filtros */}
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <input
          placeholder="Buscar lugares, eventos, restaurantes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full border px-5 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
      </div>
      <button 
        onClick={() => setIsFilterModalOpen(true)}
        className={`rounded-full border px-4 py-2 shadow-sm hover:bg-gray-50 relative ${
          filters.categories.length > 0 || filters.minRating > 0 || filters.priceRange[0] > 0 || filters.priceRange[1] < 1000
            ? 'bg-blue-100 border-blue-300 text-blue-700'
            : 'bg-white'
        }`}
      >
        Filtros
        {(filters.categories.length > 0 || filters.minRating > 0 || filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full"></span>
        )}
      </button>
    </div>

    {/* Chips de categorías - Only show for explorar and eventos tabs */}
    {(activeTab === 'explorar' || activeTab === 'eventos') && (
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border shadow-sm transition-colors ${
              selectedCategory === category 
                ? "bg-gray-900 text-white border-gray-900" 
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    )}

    {/* Tabs */}
    <div className="grid grid-cols-4 rounded-lg overflow-hidden border bg-white">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`py-2.5 text-sm transition-colors ${
            activeTab === tab.key 
              ? "bg-gray-100 font-medium" 
              : "hover:bg-gray-50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* Tab Content */}
    {renderTabContent()}

    {/* Modals */}
    {selectedEvent && (
      <EventDetailsModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    )}
    
    {selectedPlace && (
      <PlaceDetailsModal
        place={selectedPlace}
        isOpen={!!selectedPlace}
        onClose={() => setSelectedPlace(null)}
      />
    )}

    {/* Filter Modal */}
    <FilterModal
      isOpen={isFilterModalOpen}
      onClose={() => setIsFilterModalOpen(false)}
      onApplyFilters={(newFilters) => {
        setFilters(newFilters);
        // Apply additional filtering logic here if needed
        console.log('Applied filters:', newFilters);
      }}
      currentFilters={filters}
      availableCategories={categories.filter(c => c !== 'Todos')}
    />
  </section>
);
}
