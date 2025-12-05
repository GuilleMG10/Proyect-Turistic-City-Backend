import React, { useEffect, useState } from 'react';
import { Save, Loader2, DollarSign, MapPin } from 'lucide-react';
import BaseModal from '../ui/BaseModal';
import { TextInput, TextArea, NumberInput, CheckboxField, FormError } from '../ui/FormFields';
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
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={place ? 'Editar Lugar' : 'Crear Nuevo Lugar'}
      titleId="place-form-title"
      maxWidth="2xl"
      headerGradient
      zIndex={1100}
    >
      {/* Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <FormError error={error} />

          <TextInput
            id="place-name"
            label="Nombre del Lugar"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="Ej: Plaza Murillo"
            required
          />

          <TextArea
            id="place-description"
            label="Descripción"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Describe el lugar turístico..."
            required
          />

          <TextInput
            id="place-location"
            label="Ubicación"
            value={formData.location}
            onChange={(value) => setFormData({ ...formData, location: value })}
            placeholder="Ej: Centro, La Paz"
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
              id="place-category"
              label="Categoría"
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              placeholder="Ej: Histórico, Natural"
              required
            />
            <NumberInput
              id="place-price"
              label="Precio (Bs)"
              value={formData.price}
              onChange={(value) => setFormData({ ...formData, price: value })}
              placeholder="0.00"
              icon={DollarSign}
              iconColor="text-green-500"
              required
            />
          </div>

          <TextInput
            id="place-image"
            label="URL de la Imagen"
            value={formData.link_image}
            onChange={(value) => setFormData({ ...formData, link_image: value })}
            placeholder="https://ejemplo.com/imagen.jpg"
            type="url"
          />

          <CheckboxField
            id="place-active"
            label="Lugar activo y visible para todos"
            checked={formData.active}
            onChange={(checked) => setFormData({ ...formData, active: checked })}
          />

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
    </BaseModal>
  );
}
