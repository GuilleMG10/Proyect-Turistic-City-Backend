import React, { useEffect, useState } from 'react';
import { X, MapPin, Star, Calendar, Users, Edit, Trash2, Image as ImageIcon, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import type { Place } from '../types';
import { getImageSrc, handleImageError } from '../utils/imageUtils';
import { useUserStore } from '../store/userStore';
import PlaceFormModal from './PlaceFormModal';
import ConfirmModal from './ConfirmModal';
import { ApiService } from '../services/api';
import { 
  getPlaceAdditionalImages, 
  addPlaceImage, 
  removePlaceImage,
  fileToBase64,
  validateImageFile
} from '../utils/additionalImages';

type Props = {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
};

export default function PlaceDetailsModal({ place, isOpen, onClose, onUpdate }: Props) {
  const user = useUserStore((state) => state.user);
  const isAdmin = useUserStore((state) => state.isAdmin());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load additional images
  useEffect(() => {
    if (isOpen) {
      const images = getPlaceAdditionalImages(place.id);
      setAdditionalImages(images);
    }
  }, [isOpen, place.id]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the modal dialog when it opens
      const modal = document.querySelector('[role="dialog"]') as HTMLElement;
      if (modal) {
        modal.focus();
      }
    }
  }, [isOpen]);

  // Handle escape key
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

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      await ApiService.deletePlace(place.id);
      onClose();
      onUpdate?.();
    } catch {
      alert('Error al eliminar el lugar');
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = async () => {
    setIsEditModalOpen(false);
    onClose();
    onUpdate?.();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      alert(error);
      return;
    }

    setIsUploadingImage(true);
    try {
      const base64 = await fileToBase64(file);
      addPlaceImage(place.id, base64);
      const updatedImages = getPlaceAdditionalImages(place.id);
      setAdditionalImages(updatedImages);
    } catch (error) {
      alert('Error al cargar la imagen: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleImageDelete = (index: number) => {
    if (confirm('¿Eliminar esta imagen?')) {
      removePlaceImage(place.id, index);
      const updatedImages = getPlaceAdditionalImages(place.id);
      setAdditionalImages(updatedImages);
    }
  };

  if (!isOpen) return null;

  const averageRating = place.reviews && place.reviews.length > 0 
    ? place.reviews.reduce((sum: number, r) => sum + r.rating, 0) / place.reviews.length 
    : null;

  return (
    <>
      <PlaceFormModal 
        place={place}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
        onClick={onClose}
      >
      <section 
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="place-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 id="place-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">{place.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            aria-label="Cerrar detalles del lugar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Content */}
        <section className="p-6 space-y-6">
          {/* Image */}
          <figure className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative">
            <img
              src={getImageSrc(place.link_image, place.name, 'place')}
              alt={`Imagen principal de ${place.name} - ${place.description}`}
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, place.name, 'place')}
            />
            {place.display_number && (
              <div className="absolute top-3 left-3 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg border-3 border-white">
                {place.display_number}
              </div>
            )}
            <figcaption className="sr-only">Imagen representativa de {place.name}</figcaption>
          </figure>

          {/* Rating and Status */}
          <aside className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <address className="font-medium not-italic text-gray-900 dark:text-white">{place.location}</address>
            </div>
            <div className="flex items-center gap-2">
              {averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <strong className="font-medium">{averageRating.toFixed(1)}</strong>
                </div>
              )}
              <mark className={`px-2 py-1 rounded-full text-xs font-medium ${
                place.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {place.active ? 'Activo' : 'Inactivo'}
              </mark>
            </div>
          </aside>

          {/* Description */}
          <section>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Descripción</h3>
            <p className="text-gray-700 dark:text-gray-300">{place.description}</p>
          </section>

          {/* Location Details */}
          <section>
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
              <MapPin className="h-4 w-4" />
              Ubicación Detallada
            </h3>
            <address className="text-gray-700 dark:text-gray-300 mb-2 not-italic">{place.location}</address>
            {place.latitude && place.longitude && (
              <aside className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Coordenadas:</strong> {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                </p>
                <button 
                  className="text-blue-600 hover:text-blue-700 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${place.latitude},${place.longitude}`;
                    window.open(url, '_blank');
                  }}
                  aria-describedby="maps-button-desc"
                >
                  Ver en Google Maps →
                  <span id="maps-button-desc" className="sr-only">
                    Abrir la ubicación de {place.name} en Google Maps en una nueva pestaña
                  </span>
                </button>
              </aside>
            )}
          </section>

          {/* Details Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <Users className="h-4 w-4" />
                <strong className="text-sm font-medium">Categoría</strong>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">{place.category}</p>
            </article>

            <article className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <Calendar className="h-4 w-4" />
                <strong className="text-sm font-medium">Registrado</strong>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">
                <time dateTime={place.created_at}>{new Date(place.created_at).toLocaleDateString('es-ES')}</time>
              </p>
            </article>
          </section>

          {/* Additional Images Section */}
          {isAdmin && (
            <section className="border-t pt-6">
              <button
                onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Mostrar información adicional</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({additionalImages.length} {additionalImages.length === 1 ? 'imagen' : 'imágenes'})
                  </span>
                </div>
                {showAdditionalInfo ? (
                  <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {showAdditionalInfo && (
                <div className="mt-4 space-y-4">
                  {/* Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className={`cursor-pointer inline-flex flex-col items-center gap-2 ${
                        isUploadingImage ? 'opacity-50' : ''
                      }`}
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {isUploadingImage ? 'Cargando...' : 'Cargar imagen JPG'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Máx. 5MB</span>
                    </label>
                  </div>

                  {/* Images Grid */}
                  {additionalImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {additionalImages.map((image, index) => (
                        <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={image}
                            alt={`Imagen adicional ${index + 1} de ${place.name}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleImageDelete(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={`Eliminar imagen ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Reviews */}
          {place.reviews && place.reviews.length > 0 && (
            <section>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <Star className="h-4 w-4" />
                Reseñas ({place.reviews.length})
              </h3>
              <div className="space-y-3">
                {place.reviews.map((review) => (
                  <article key={review.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <strong className="text-sm font-medium text-gray-900 dark:text-white">{review.rating}/5</strong>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('es-ES')}</time>
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <footer className="flex gap-3 pt-4">
            {isAdmin ? (
              <>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar Lugar
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </>
            ) : (
              <>
                {user && (
                  <button 
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    aria-describedby="favorite-button-desc"
                  >
                    Agregar a favoritos
                    <span id="favorite-button-desc" className="sr-only">
                    Agregar este lugar a tu lista de favoritos
                    </span>
                  </button>
                )}
                <button 
                  className={`${user ? 'flex-1' : 'w-full'} border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100`}
                  aria-describedby="share-place-desc"
                >
                  Compartir lugar
                  <span id="share-place-desc" className="sr-only">
                    Compartir la información de este lugar en redes sociales
                  </span>
                </button>
              </>
            )}
          </footer>
        </section>
      </section>
    </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="¿Eliminar este lugar?"
        message={`¿Estás seguro de que deseas eliminar "${place.name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </>
  );
}