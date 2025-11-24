import { useState } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import { Map as MapIcon, Calendar, Check } from "lucide-react";
import MapView from "../../components/features/MapView";
import type { ExploreContextType } from "./types";
import type { Place, Event } from "../../types";
import { getEventStatus } from "../../services/api";

export default function ExploreMap() {
  const { 
    filteredPlaces, 
    filteredEvents, 
    openPlaceModal, 
    openEventModal 
  } = useOutletContext<ExploreContextType>();
  
  const location = useLocation();
  const [showPlacesOnMap, setShowPlacesOnMap] = useState(true);
  const [showEventsOnMap, setShowEventsOnMap] = useState(true);
  
  // Use location state for center if available
  const mapCenter = location.state?.center;

  const handleMapMarkerClick = (item: Place | Event, type: 'place' | 'event') => {
    if (type === 'place') {
      openPlaceModal(item as Place);
    } else {
      const event = item as Event;
      openEventModal({
        ...event,
        status: getEventStatus(event.event_date)
      });
    }
  };

  return (
    <section aria-labelledby="mapa-heading" className="h-[calc(100vh-240px)] min-h-[600px] flex flex-col relative group">
      <h2 id="mapa-heading" className="sr-only">Mapa de Lugares y Eventos</h2>
      
      {/* Floating Controls */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 w-full max-w-xs pointer-events-none">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-1 pointer-events-auto w-fit">
          <button
            onClick={() => setShowPlacesOnMap(!showPlacesOnMap)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${showPlacesOnMap 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
            `}
          >
            {showPlacesOnMap && <Check className="h-3.5 w-3.5" />}
            <MapIcon className="h-4 w-4" />
            <span>Lugares</span>
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
              {filteredPlaces.length}
            </span>
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          <button
            onClick={() => setShowEventsOnMap(!showEventsOnMap)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${showEventsOnMap 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
            `}
          >
            {showEventsOnMap && <Check className="h-3.5 w-3.5" />}
            <Calendar className="h-4 w-4" />
            <span>Eventos</span>
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
              {filteredEvents.length}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-grow w-full h-full rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 relative bg-gray-100 dark:bg-gray-900">
        <MapView
          places={filteredPlaces}
          events={filteredEvents}
          showPlaces={showPlacesOnMap}
          showEvents={showEventsOnMap}
          center={mapCenter}
          zoom={mapCenter ? 17 : undefined}
          onMarkerClick={handleMapMarkerClick}
        />
      </div>
    </section>
  );
}
