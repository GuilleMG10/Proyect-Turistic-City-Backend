import React, { useEffect, useState } from 'react';
import { X, MapPin, Calendar, Save, Loader2, DollarSign } from 'lucide-react';
import type { Event } from '../../types';
import { ApiService } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import LocationPicker from '../features/LocationPicker';

type Props = {
  event?: Event;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedEvent: Event) => void;
};

export default function EventFormModal({ event, isOpen, onClose, onSuccess }: Props) {
  const user = useUserStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    latitude: 0,
    longitude: 0,
    event_date: '',
    category: '',
    price: 0,
    link_image: '',
  });

  useEffect(() => {
    if (event) {
      // Convert ISO date to datetime-local format
      const date = new Date(event.event_date);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      
      setFormData({
        name: event.name,
        description: event.description,
        location: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        event_date: localDateTime,
        category: event.category,
        price: event.price,
        link_image: event.link_image || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        location: '',
        latitude: 0,
        longitude: 0,
        event_date: '',
        category: '',
        price: 0,
        link_image: '',
      });
    }
    setError(null);
  }, [event, isOpen]);

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
      // Convert datetime-local to ISO string
      const eventDate = new Date(formData.event_date).toISOString();
      
      const eventData = {
        ...formData,
        event_date: eventDate,
        user_id: user?.id || 0,
        link_image: formData.link_image || null,
      };

      let result: Event;
      if (event) {
        result = await ApiService.updateEvent(event.id, eventData);
      } else {
        result = await ApiService.createEvent(eventData);
      }
      
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el evento');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4"
      onClick={onClose}
    >
      <section 
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-800" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="event-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="relative bg-gradient-to-r from-cyan-500 to-blue-600 p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative flex items-center justify-between text-white">
            <h2 id="event-form-title" className="text-2xl font-bold flex items-center gap-2">
              {event ? 'Editar Evento' : 'Crear Nuevo Evento'}
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
            <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre del Evento *
            </label>
            <input
              id="event-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              placeholder="Ej: Festival de la Candelaria"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Descripción *
            </label>
            <textarea
              id="event-description"
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none"
              placeholder="Describe el evento..."
            />
          </div>

          {/* Event Date */}
          <div>
            <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-500" />
              Fecha y Hora del Evento *
            </label>
            <input
              id="event-date"
              type="datetime-local"
              required
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* Location with Map Picker */}
          <div>
            <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-500" />
              Ubicación *
            </label>
            <input
              id="event-location"
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              placeholder="Ej: Plaza San Francisco, La Paz"
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
              <label htmlFor="event-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Categoría *
              </label>
              <input
                id="event-category"
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                placeholder="Ej: Cultural, Deportivo"
              />
            </div>
            <div>
              <label htmlFor="event-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Precio (Bs) *
              </label>
              <input
                id="event-price"
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
                  {event ? 'Actualizar' : 'Crear'} Evento
                </>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
