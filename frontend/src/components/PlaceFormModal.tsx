import React, { useEffect, useState } from 'react';
import { X, MapPin, Save, Loader2 } from 'lucide-react';
import type { Place } from '../types';
import { ApiService } from '../services/api';
import { useUserStore } from '../store/userStore';
import LocationPicker from './LocationPicker';

type Props = {
  place?: Place;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPlace: Place) => void;
};

export default function PlaceFormModal({ place, isOpen, onClose, onSuccess }: Props) {
  const user = useUserStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    latitude: 0,
    longitude: 0,
    category: '',
    link_image: '',
    active: true,
  });

  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name,
        description: place.description,
        location: place.location,
        latitude: place.latitude,
        longitude: place.longitude,
        category: place.category,
        link_image: place.link_image || '',
        active: place.active,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        location: '',
        latitude: 0,
        longitude: 0,
        category: '',
        link_image: '',
        active: true,
      });
    }
    setError(null);
  }, [place, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleLocationChange = (lat: number, lng: number, address?: string) => {
    setFormData({ 
      ...formData, 
      latitude: lat, 
      longitude: lng,
      location: address || formData.location
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const placeData = {
        ...formData,
        user_id: user?.id || 0,
      };

      let result: Place;
      if (place) {
        result = await ApiService.updatePlace(place.id, placeData);
      } else {
        result = await ApiService.createPlace(placeData);
      }
      
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el lugar');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[80] p-4"
      onClick={onClose}
    >
      <section 
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="place-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 id="place-form-title" className="text-xl font-semibold text-gray-900 dark:text-white">
            {place ? 'Editar Lugar' : 'Crear Nuevo Lugar'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            aria-label="Cerrar formulario"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded" role="alert">
              <strong className="font-medium">Error:</strong> {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="place-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del Lugar *
            </label>
            <input
              id="place-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Plaza Murillo"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="place-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción *
            </label>
            <textarea
              id="place-description"
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe el lugar turístico..."
            />
          </div>

          {/* Location with Map Picker */}
          <div>
            <label htmlFor="place-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación *
            </label>
            <input
              id="place-location"
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Centro, La Paz"
            />
          </div>

          {/* Map Location Picker */}
          <LocationPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
          />

          {/* Category */}
          <div>
            <label htmlFor="place-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría *
            </label>
            <input
              id="place-category"
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Histórico, Natural, Cultural"
            />
          </div>

          {/* Image Link */}
          <div>
            <label htmlFor="place-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL de la Imagen
            </label>
            <input
              id="place-image"
              type="url"
              value={formData.link_image}
              onChange={(e) => setFormData({ ...formData, link_image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              id="place-active"
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label htmlFor="place-active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Lugar activo
            </label>
          </div>

          {/* Action Buttons */}
          <footer className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {place ? 'Actualizar' : 'Crear'} Lugar
                </>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
