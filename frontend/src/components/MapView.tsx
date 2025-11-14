import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { Icon, DivIcon } from 'leaflet';
import { MapPin, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import type { Place, Event } from '../types';
import { useThemeStore } from '../store/themeStore';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Custom icon with place number
const createNumberedIcon = (number: number): DivIcon => {
  return new DivIcon({
    className: 'custom-numbered-icon',
    html: `
      <div style="
        background-color: #3b82f6;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">${number}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Component to handle dynamic map center updates
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  
  return null;
}

type Props = {
  places?: Place[];
  events?: Event[];
  showPlaces?: boolean;
  showEvents?: boolean;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (item: Place | Event, type: 'place' | 'event') => void;
};

export default function MapView({ 
  places = [], 
  events = [], 
  showPlaces = true, 
  showEvents = true,
  center = [-17.3935, -66.1570], // Cochabamba default
  zoom = 13,
  onMarkerClick
}: Props) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  
  // Derive filtered data directly instead of using state + effect
  const filteredPlaces = showPlaces ? places : [];
  const filteredEvents = showEvents ? events : [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Only show legend if there are places or events to display
  const shouldShowLegend = (showPlaces && filteredPlaces.length > 0) || (showEvents && filteredEvents.length > 0);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <MapUpdater center={center} zoom={zoom} />
        <TileLayer
          attribution=''
          url={
            isDark
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />

        {/* Places Markers with Clustering */}
        <MarkerClusterGroup>
          {filteredPlaces.map((place) => (
            <Marker
              key={`place-${place.id}`}
              position={[place.latitude, place.longitude]}
              icon={place.display_number ? createNumberedIcon(place.display_number) : DefaultIcon}
            >
              <Popup>
                <div className="min-w-[200px] max-w-[280px]">
                  {place.display_number && (
                    <div className="mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
                        {place.display_number}
                      </span>
                    </div>
                  )}
                  <h3 className="font-semibold text-base mb-1 text-gray-900 dark:text-white">{place.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{place.description}</p>
                  
                  <div className="space-y-1 text-xs mb-2">
                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{place.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                        {place.category}
                      </span>
                      {place.active && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                          Activo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Click to view details button - Mobile friendly */}
                  <button
                    onClick={() => onMarkerClick?.(place, 'place')}
                    className="w-full mt-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-700 text-white text-xs rounded hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver detalles
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* Events Markers with Clustering */}
        <MarkerClusterGroup>
          {filteredEvents.map((event) => (
            <Marker
              key={`event-${event.id}`}
              position={[event.latitude, event.longitude]}
              icon={DefaultIcon}
            >
              <Popup>
                <div className="min-w-[200px] max-w-[280px]">
                  <h3 className="font-semibold text-base mb-1 text-gray-900 dark:text-white">{event.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-1 text-xs mb-2">
                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="text-xs">{formatDate(event.event_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <DollarSign className="h-3 w-3 flex-shrink-0" />
                      <span>{event.price === 0 ? 'Gratis' : `${event.price} Bs`}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                        {event.category}
                      </span>
                    </div>
                  </div>

                  {/* Click to view details button - Mobile friendly */}
                  <button
                    onClick={() => onMarkerClick?.(event, 'event')}
                    className="w-full mt-2 px-3 py-1.5 bg-purple-600 dark:bg-purple-700 text-white text-xs rounded hover:bg-purple-700 dark:hover:bg-purple-800 flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver detalles
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Legend - Only show if there are items to display */}
      {shouldShowLegend && (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-[500] border dark:border-gray-700">
          <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">Leyenda</h4>
          <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
            {showPlaces && filteredPlaces.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Lugares ({filteredPlaces.length})</span>
              </div>
            )}
            {showEvents && filteredEvents.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Eventos ({filteredEvents.length})</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
