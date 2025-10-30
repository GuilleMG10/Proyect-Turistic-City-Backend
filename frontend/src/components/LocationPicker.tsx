import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng, Icon } from 'leaflet';
import type * as L from 'leaflet';
import { Search, MapPin, Loader2 } from 'lucide-react';
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

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      <form onSubmit={handleSearch} onClick={(e) => e.stopPropagation()} className="mb-3">
        <label htmlFor="location-search" className="block text-sm font-medium text-gray-700 mb-1">
          Buscar Ubicación
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="location-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: Plaza Murillo, Cochabamba"
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSearching}
            />
            <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSearch(e as unknown as React.FormEvent<HTMLFormElement>);
            }}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Buscar
              </>
            )}
          </button>
        </div>
        {searchError && (
          <p className="text-sm text-red-600 mt-1">{searchError}</p>
        )}
      </form>

      {/* Map */}
      <div className="border border-gray-300 rounded-md overflow-hidden h-[300px] relative z-0">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} onPositionChange={handlePositionChange} />
        </MapContainer>
      </div>

      {/* Coordinates Display */}
      <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        <span>
          Coordenadas seleccionadas: <strong>{position.lat.toFixed(6)}</strong>, <strong>{position.lng.toFixed(6)}</strong>
        </span>
      </div>
    </div>
  );
}
