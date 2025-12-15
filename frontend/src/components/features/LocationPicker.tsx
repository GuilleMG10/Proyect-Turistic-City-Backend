import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng, Icon } from 'leaflet';
import type * as L from 'leaflet';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Props = {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  className?: string;
};

// Component to handle map clicks
function LocationMarker({ position, onPositionChange }: {
  position: LatLng;
  onPositionChange: (latlng: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });

  return <Marker position={position} icon={DefaultIcon} />;
}

export default function LocationPicker({ latitude, longitude, onLocationChange, className = '' }: Props) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [position, setPosition] = useState<LatLng>(new LatLng(latitude || -17.3935, longitude || -66.1570));
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Update position when props change
  useEffect(() => {
    if (latitude && longitude) {
      const newPos = new LatLng(latitude, longitude);
      setPosition(newPos);
      if (mapRef.current) {
        mapRef.current.setView(newPos, mapRef.current.getZoom());
      }
    }
  }, [latitude, longitude]);

  const handlePositionChange = (latlng: LatLng) => {
    setPosition(latlng);
    onLocationChange(latlng.lat, latlng.lng);

    // Reverse geocoding to get address
    reverseGeocode(latlng.lat, latlng.lng);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CulturistaApp/1.0'
          }
        }
      );
      const data = await response.json();
      if (data.display_name) {
        onLocationChange(lat, lng, data.display_name);
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
    }
  };

  const handleSearchClick = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // Using Nominatim (OpenStreetMap) for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'CulturistaApp/1.0'
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newPos = new LatLng(parseFloat(result.lat), parseFloat(result.lon));
        setPosition(newPos);
        onLocationChange(newPos.lat, newPos.lng, result.display_name);

        // Center map on new position
        if (mapRef.current) {
          mapRef.current.setView(newPos, 15);
        }
      } else {
        setSearchError('No se encontró la ubicación. Intenta con otra búsqueda.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchError('Error al buscar la ubicación. Intenta nuevamente.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
        <label htmlFor="location-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Buscar Ubicación
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="location-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchClick();
                }
              }}
              placeholder="Ej: Plaza Murillo, Cochabamba"
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all shadow-sm"
              disabled={isSearching}
            />
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2.5 bg-cyan-600 dark:bg-cyan-700 text-white rounded-xl hover:bg-cyan-700 dark:hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Buscando...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Buscar</span>
              </>
            )}
          </button>
        </div>
        {searchError && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block"></span>
            {searchError}
          </p>
        )}
      </div>

      {/* Map */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden h-[300px] relative z-0 shadow-inner">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          attributionControl={false}
        >
          <TileLayer
            attribution=''
            url={
              isDark
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
          />
          <LocationMarker position={position} onPositionChange={handlePositionChange} />
        </MapContainer>
      </div>

      {/* Coordinates Display */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 px-1">
        <MapPin className="h-3.5 w-3.5 text-cyan-500" aria-hidden="true" />
        <span>
          Coordenadas: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</span>
        </span>
      </div>
    </div>
  );
}
