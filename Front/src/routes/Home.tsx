// @ts-ignore
import { useEffect, useState } from "react";
import type { Place, Event } from "../types";
import PlaceGrid from "../components/PlaceGrid";
import EventGrid from "../components/EventGrid";
import ErrorBanner from "../components/ErrorBanner";
import PlaceDetailsModal from "../components/PlaceDetailsModal";
import FilterModal from "../components/FilterModal";
import { ApiService } from "../services/api";

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Explorar");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 1000] as [number, number],
    ageRange: [0, 100] as [number, number],
    minRating: 0,
    zones: [] as string[],
  });

  // Context-specific categories based on active tab
  const getAvailableCategories = () => {
    if (activeTab === "Explorar") {
      const placeCategories = [...new Set(places.map(place => place.category).filter(Boolean))].sort();
      return ["Todos", ...placeCategories];
    } else if (activeTab === "Eventos") {
      const eventCategories = [...new Set(events.map(event => event.category).filter(Boolean))].sort();
      return ["Todos", ...eventCategories];
    } else {
      // For "Para Ti" and "Calendario" tabs, don't show categories
      return [];
    }
  };

  const categories = getAvailableCategories();
  
  // Only show category chips for tabs that have content with categories
  const shouldShowCategories = activeTab === "Explorar" || activeTab === "Eventos";

  // Load places from API
  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      setLoading(true);
      setErr(null);

      try {
        const fetchedPlaces = await ApiService.getPlaces();
        if (!cancelled) {
          setPlaces(fetchedPlaces);
          setFilteredPlaces(fetchedPlaces);
        }
      } catch (error) {
        console.error("API Error:", error);
        if (!cancelled) {
          setErr("No se pudieron cargar los lugares del servidor.");
          setPlaces([]);
          setFilteredPlaces([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    async function loadEvents() {
      // Load events from API
      try {
        const fetchedEvents = await ApiService.getEvents();
        if (!cancelled) {
          setEvents(fetchedEvents);
          setFilteredEvents(fetchedEvents);
        }
      } catch (error) {
        console.error("Events API Error:", error);
        if (!cancelled) {
          // Events are optional, so don't show error, just keep empty
          setEvents([]);
          setFilteredEvents([]);
        }
      }
    }

    loadPlaces();
    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  // Advanced filtering logic that combines search, category, and filter criteria
  useEffect(() => {
    // Filter places
    let filteredP = places;
    
    // Text search
    if (searchQuery.trim()) {
      filteredP = filteredP.filter(place => 
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Category filter (from quick category buttons)
    if (selectedCategory !== "Todos") {
      filteredP = filteredP.filter(place => 
        place.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Advanced filters from FilterModal
    // Categories filter (multiple selection)
    if (filters.categories.length > 0) {
      filteredP = filteredP.filter(place => 
        filters.categories.some(cat => 
          place.category.toLowerCase() === cat.toLowerCase()
        )
      );
    }
    
    // Price range filter
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
      filteredP = filteredP.filter(place => {
        const minPrice = place.price_min || 0;
        const maxPrice = place.price_max || minPrice;
        return maxPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1];
      });
    }
    
    // Age range filter
    if (filters.ageRange[0] > 0 || filters.ageRange[1] < 100) {
      filteredP = filteredP.filter(place => {
        const minAge = place.min_age || 0;
        const maxAge = place.max_age || 100;
        return minAge >= filters.ageRange[0] && maxAge <= filters.ageRange[1];
      });
    }
    
    // Rating filter
    if (filters.minRating > 0) {
      filteredP = filteredP.filter(place => {
        const placeRating = place.rating || 0;
        return placeRating >= filters.minRating;
      });
    }
    
    // Zone filter (would need to add zone data to places in the future)
    if (filters.zones.length > 0) {
      // For now, we'll assume city acts as zone, but this could be expanded
      // filteredP = filteredP.filter(place => filters.zones.includes(place.zone));
    }
    
    setFilteredPlaces(filteredP);

    // Filter events
    let filteredE = events;
    if (searchQuery.trim()) {
      filteredE = filteredE.filter(event => 
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== "Todos") {
      filteredE = filteredE.filter(event => 
        event.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    setFilteredEvents(filteredE);
  }, [places, events, searchQuery, selectedCategory, filters]);

  // Reset selected category if it's no longer available in current tab
  useEffect(() => {
    const availableCategories = getAvailableCategories();
    if (!availableCategories.includes(selectedCategory)) {
      setSelectedCategory("Todos");
    }
  }, [activeTab, places, events]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Reset category selection when switching tabs to avoid orphaned categories
    setSelectedCategory("Todos");
  };

  const handleViewPlace = (place: Place) => {
    setSelectedPlace(place);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlace(null);
  };

return (
  <section className="space-y-6">
    {err && <ErrorBanner message={err} />}

    {/* Buscar + Filtros */}
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <input
          placeholder="Buscar lugares, eventos, restaurantes..."
          className="w-full rounded-full border px-5 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
      </div>
      <button 
        className="rounded-full border px-4 py-2 bg-white shadow-sm hover:bg-gray-50"
        onClick={() => setIsFilterModalOpen(true)}
      >
        Filtros
      </button>
    </div>

    {/* Chips de categorías - only show for content tabs with categories */}
    {shouldShowCategories && categories.length > 1 && (
      <div className="flex flex-wrap gap-3">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => handleCategorySelect(c)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border shadow-sm ${
              selectedCategory === c ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    )}

    {/* Results counter - only show for content tabs */}
    {!loading && shouldShowCategories && (
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {activeTab === "Explorar" 
            ? `${filteredPlaces.length} lugares encontrados`
            : activeTab === "Eventos"
            ? `${filteredEvents.length} eventos encontrados`
            : ""
          }
        </span>
        {(filters.categories.length > 0 || filters.minRating > 0 || filters.priceRange[0] > 0 || filters.priceRange[1] < 1000 || filters.ageRange[0] > 0 || filters.ageRange[1] < 100) && (
          <button
            onClick={() => setFilters({
              categories: [],
              priceRange: [0, 1000],
              ageRange: [0, 100],
              minRating: 0,
              zones: [],
            })}
            className="text-blue-600 hover:text-blue-800"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    )}

    {/* Tabs */}
    <div className="grid grid-cols-4 rounded-lg overflow-hidden border bg-white">
      {["Explorar", "Eventos", "Para Ti", "Calendario"].map((t) => (
        <button
          key={t}
          onClick={() => handleTabChange(t)}
          className={`py-2.5 text-sm ${
            activeTab === t ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
          }`}
        >
          {t}
        </button>
      ))}
    </div>

    {/* Grid de tarjetas */}
    {loading ? (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200/70" />
        ))}
      </div>
    ) : activeTab === "Explorar" ? (
      <PlaceGrid
        places={filteredPlaces}
        onInterest={(p) => console.log("Me interesa:", p.name)}
        onView={handleViewPlace}
      />
    ) : activeTab === "Eventos" ? (
      <EventGrid
        events={filteredEvents}
        onInterest={(e) => console.log("Me interesa evento:", e.name)}
        onView={(e) => console.log("Ver detalles evento:", e.name)}
      />
    ) : (
      <div className="text-center py-12 text-gray-500">
        <p>Funcionalidad "{activeTab}" próximamente...</p>
      </div>
    )}

    {/* Place Details Modal */}
    {selectedPlace && (
      <PlaceDetailsModal
        place={selectedPlace}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    )}

    {/* Filter Modal */}
    <FilterModal
      isOpen={isFilterModalOpen}
      onClose={() => setIsFilterModalOpen(false)}
      onApplyFilters={(newFilters) => {
        setFilters(newFilters);
        setIsFilterModalOpen(false);
      }}
      currentFilters={filters}
      availableCategories={categories}
    />
  </section>
);
}
