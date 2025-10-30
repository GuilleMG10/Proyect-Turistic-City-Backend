import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { MapPin, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import type { Place, Event } from '../types';
import 'leaflet/dist/leaflet.css';

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

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Places Markers */}
        {filteredPlaces.map((place) => (
            <Marker
              key={`place-${place.id}`}
              position={[place.latitude, place.longitude]}
              icon={DefaultIcon}
            >
              <Popup>
                <div className="min-w-[200px] max-w-[280px]">
                  <h3 className="font-semibold text-base mb-1">{place.name}</h3>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{place.description}</p>
                  
                  <div className="space-y-1 text-xs mb-2">
                    <div className="flex items-center gap-1 text-gray-700">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{place.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {place.category}
                      </span>
                      {place.active && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Activo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Click to view details button - Mobile friendly */}
                  <button
                    onClick={() => onMarkerClick?.(place, 'place')}
                    className="w-full mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver detalles
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Events Markers */}
          {filteredEvents.map((event) => (
            <Marker
              key={`event-${event.id}`}
              position={[event.latitude, event.longitude]}
              icon={DefaultIcon}
            >
              <Popup>
                <div className="min-w-[200px] max-w-[280px]">
                  <h3 className="font-semibold text-base mb-1">{event.name}</h3>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-1 text-xs mb-2">
                    <div className="flex items-center gap-1 text-gray-700">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="text-xs">{formatDate(event.event_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-700">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-700">
                      <DollarSign className="h-3 w-3 flex-shrink-0" />
                      <span>{event.price === 0 ? 'Gratis' : `${event.price} Bs`}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        {event.category}
                      </span>
                    </div>
                  </div>

                  {/* Click to view details button - Mobile friendly */}
                  <button
                    onClick={() => onMarkerClick?.(event, 'event')}
                    className="w-full mt-2 px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver detalles
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[500]">
        <h4 className="font-semibold text-sm mb-2">Leyenda</h4>
        <div className="space-y-1 text-xs">
          {showPlaces && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Lugares ({filteredPlaces.length})</span>
            </div>
          )}
          {showEvents && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Eventos ({filteredEvents.length})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
