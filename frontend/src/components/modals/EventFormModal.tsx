import { useEffect, useState, type FormEvent } from 'react';
import { MapPin, Save, Loader2, DollarSign } from 'lucide-react';
import BaseModal from '../ui/BaseModal';
import { TextInput, TextArea, NumberInput, FormError } from '../ui/FormFields';
import DateTimePicker from '../ui/DateTimePicker';
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

  const handleLocationChange = (lat: number, lng: number, address?: string) => {
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng,
      location: address || formData.location
    });
  };

  const handleSubmit = async (e: FormEvent) => {
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
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? 'Editar Evento' : 'Crear Nuevo Evento'}
      titleId="event-form-title"
      maxWidth="2xl"
      headerGradient
      zIndex={1100}
    >
      {/* Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <FormError error={error} />

        <TextInput
          id="event-name"
          label="Nombre del Evento"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          placeholder="Ej: Festival de la Candelaria"
          required
        />

        <TextArea
          id="event-description"
          label="Descripción"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Describe el evento..."
          required
        />

        <DateTimePicker
          value={formData.event_date}
          onChange={(value) => setFormData({ ...formData, event_date: value })}
          label="Fecha y Hora del Evento"
          placeholder="Seleccionar fecha y hora"
          required
        />

        <TextInput
          id="event-location"
          label="Ubicación"
          value={formData.location}
          onChange={(value) => setFormData({ ...formData, location: value })}
          placeholder="Ej: Plaza San Francisco, La Paz"
          icon={MapPin}
          iconColor="text-cyan-500"
          required
        />

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
          <TextInput
            id="event-category"
            label="Categoría"
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            placeholder="Ej: Cultural, Deportivo"
            required
          />
          <NumberInput
            id="event-price"
            label="Precio (Bs)"
            value={formData.price}
            onChange={(value) => setFormData({ ...formData, price: value })}
            placeholder="0.00"
            icon={DollarSign}
            iconColor="text-green-500"
            required
          />
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
    </BaseModal>
  );
}
