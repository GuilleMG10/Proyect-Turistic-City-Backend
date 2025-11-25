import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { Icon, DivIcon } from 'leaflet';
import { MapPin, Calendar, DollarSign, ExternalLink, Star } from 'lucide-react';
import type { Place, Event } from '../../types';
import { useThemeStore } from '../../store/themeStore';
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
const createNumberedIcon = (number: number, isDark: boolean): DivIcon => {
  const bgColor = '#2563eb'; // blue-600
  const borderColor = isDark ? '#1f2937' : '#ffffff'; // gray-800 or white
  
  return new DivIcon({
    className: 'custom-numbered-icon',
    html: `
      <div style="
        background-color: ${bgColor};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        border: 3px solid ${borderColor};
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        font-family: system-ui, -apple-system, sans-serif;
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
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Only show legend if there are places or events to display
  const shouldShowLegend = (showPlaces && filteredPlaces.length > 0) || (showEvents && filteredEvents.length > 0);

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-gray-900">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        attributionControl={false}
        zoomControl={false}
        className="z-0"
      >
        <MapUpdater center={center} zoom={zoom} />
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution=''
          url={
            isDark
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />

        {/* Places Markers with Clustering */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
        >
          {filteredPlaces.map((place) => (
            <Marker
              key={`place-${place.id}`}
              position={[place.latitude, place.longitude]}
              icon={place.display_number ? createNumberedIcon(place.display_number, isDark) : DefaultIcon}
            >
              <Popup className="custom-popup" closeButton={false}>
                <div className="min-w-[260px] max-w-[280px] p-4">
                  <div className="relative h-24 bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden mb-3 -mx-4 -mt-4">
                    {/* Placeholder for image if available, or gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-90" />
                    <div className="absolute bottom-2 left-4 right-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-white/20 text-white backdrop-blur-sm border border-white/10">
                        {place.category}
                      </span>
                    </div>
                    {place.display_number && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold shadow-lg text-sm">
                        {place.display_number}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-base leading-tight text-gray-900 dark:text-gray-100 mb-1">{place.name}</h3>
                  
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-2">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs truncate">{place.location}</span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
                    {place.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-gray-700">4.5</span>
                    </div>
                    {place.active && (
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Abierto ahora
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onMarkerClick?.(place, 'place')}
                    className="w-full py-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    Ver detalles
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* Events Markers with Clustering */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
        >
          {filteredEvents.map((event) => (
            <Marker
              key={`event-${event.id}`}
              position={[event.latitude, event.longitude]}
              icon={DefaultIcon}
            >
              <Popup className="custom-popup" closeButton={false}>
                <div className="min-w-[260px] max-w-[280px] p-4">
                  <div className="relative h-24 bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden mb-3 -mx-4 -mt-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-90" />
                    <div className="absolute bottom-2 left-4 right-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-white/20 text-white backdrop-blur-sm border border-white/10">
                        {event.category}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base leading-tight text-gray-900 dark:text-gray-900 mb-1">{event.name}</h3>
                  
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-600 mb-3">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs truncate">{event.location}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 p-1.5 rounded-md border border-gray-100">
                      <Calendar className="h-3 w-3 text-purple-500" />
                      <span className="truncate">{formatDate(event.event_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 p-1.5 rounded-md border border-gray-100">
                      <DollarSign className="h-3 w-3 text-emerald-500" />
                      <span className="font-medium">{event.price === 0 ? 'Gratis' : `${event.price} Bs`}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onMarkerClick?.(event, 'event')}
                    className="w-full py-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    Ver detalles
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Legend - Only show if there are items to display */}
      {shouldShowLegend && (
        <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg p-4 z-[500] border border-gray-200/50 dark:border-gray-700/50 min-w-[180px]">
          <h4 className="font-bold text-xs uppercase tracking-wider mb-3 text-gray-500 dark:text-gray-400">Leyenda</h4>
          <div className="space-y-2.5">
            {showPlaces && filteredPlaces.length > 0 && (
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Lugares</span>
                </div>
                <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                  {filteredPlaces.length}
                </span>
              </div>
            )}
            {showEvents && filteredEvents.length > 0 && (
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Eventos</span>
                </div>
                <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                  {filteredEvents.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
