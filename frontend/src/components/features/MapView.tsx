import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import type { Place, Event } from '../../types';
import { useThemeStore } from '../../store/themeStore';
import { DefaultIcon, createNumberedIcon, MapLegend, PlacePopup, EventPopup } from './map';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

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

  // Build legend items
  const legendItems = [
    ...(showPlaces && filteredPlaces.length > 0 
      ? [{ label: 'Lugares', count: filteredPlaces.length, color: '#2563eb' }] 
      : []),
    ...(showEvents && filteredEvents.length > 0 
      ? [{ label: 'Eventos', count: filteredEvents.length, color: '#a855f7' }] 
      : []),
  ];

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
                <PlacePopup 
                  place={place} 
                  onViewDetails={() => onMarkerClick?.(place, 'place')} 
                />
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
                <EventPopup 
                  event={event} 
                  onViewDetails={() => onMarkerClick?.(event, 'event')} 
                />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Legend */}
      <MapLegend items={legendItems} />
    </div>
  );
}
