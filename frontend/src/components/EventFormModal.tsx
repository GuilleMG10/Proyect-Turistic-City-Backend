import { useEffect, useState } from 'react';
import { X, MapPin, Calendar, Save, Loader2, DollarSign } from 'lucide-react';
import type { Event } from '../types';
import { ApiService } from '../services/api';
import { useUserStore } from '../store/userStore';

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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <section 
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="event-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 id="event-form-title" className="text-xl font-semibold">
            {event ? 'Editar Evento' : 'Crear Nuevo Evento'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar formulario"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
              <strong className="font-medium">Error:</strong> {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Evento *
            </label>
            <input
              id="event-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Festival de la Candelaria"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              id="event-description"
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe el evento..."
            />
          </div>

          {/* Event Date */}
          <div>
            <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha y Hora del Evento *
            </label>
            <input
              id="event-date"
              type="datetime-local"
              required
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación *
            </label>
            <input
              id="event-location"
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Plaza San Francisco, La Paz"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="event-latitude" className="block text-sm font-medium text-gray-700 mb-1">
                Latitud *
              </label>
              <input
                id="event-latitude"
                type="number"
                step="0.000001"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="-16.500000"
              />
            </div>
            <div>
              <label htmlFor="event-longitude" className="block text-sm font-medium text-gray-700 mb-1">
                Longitud *
              </label>
              <input
                id="event-longitude"
                type="number"
                step="0.000001"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="-68.150000"
              />
            </div>
          </div>

          {/* Category and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="event-category" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <input
                id="event-category"
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Cultural, Deportivo"
              />
            </div>
            <div>
              <label htmlFor="event-price" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <footer className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
