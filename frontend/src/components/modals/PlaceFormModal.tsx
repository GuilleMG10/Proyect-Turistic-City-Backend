import React, { useEffect, useState } from 'react';
import { X, MapPin, Save, Loader2, DollarSign } from 'lucide-react';
import type { Place } from '../../types';
import { ApiService } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import LocationPicker from '../features/LocationPicker';

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
    price: 0,
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
        price: place.price || 0,
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
        price: 0,
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4"
      onClick={onClose}
    >
      <section 
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-800" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="place-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="relative bg-gradient-to-r from-cyan-500 to-blue-600 p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative flex items-center justify-between text-white">
            <h2 id="place-form-title" className="text-2xl font-bold flex items-center gap-2">
              {place ? 'Editar Lugar' : 'Crear Nuevo Lugar'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/90 hover:text-white"
              aria-label="Cerrar formulario"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl" role="alert">
              <strong className="font-medium">Error:</strong> {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="place-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre del Lugar *
            </label>
            <input
              id="place-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              placeholder="Ej: Plaza Murillo"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="place-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Descripción *
            </label>
            <textarea
              id="place-description"
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none"
              placeholder="Describe el lugar turístico..."
            />
          </div>

          {/* Location with Map Picker */}
          <div>
            <label htmlFor="place-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-500" />
              Ubicación *
            </label>
            <input
              id="place-location"
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              placeholder="Ej: Centro, La Paz"
            />
          </div>

          {/* Map Location Picker */}
          <div className="rounded-xl overflow-hidden">
            <LocationPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={handleLocationChange}
            />
          </div>

          {/* Category and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="place-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Categoría *
              </label>
              <input
                id="place-category"
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="Ej: Histórico, Natural"
              />
            </div>
            <div>
              <label htmlFor="place-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Precio (Bs) *
              </label>
              <input
                id="place-price"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Image Link */}
          <div>
            <label htmlFor="place-image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              URL de la Imagen
            </label>
            <input
              id="place-image"
              type="url"
              value={formData.link_image}
              onChange={(e) => setFormData({ ...formData, link_image: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <input
              id="place-active"
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-gray-300 dark:border-gray-600 rounded transition-all"
            />
            <label htmlFor="place-active" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Lugar activo y visible para todos
            </label>
          </div>

          {/* Action Buttons */}
          <footer className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 flex items-center justify-center gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
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
