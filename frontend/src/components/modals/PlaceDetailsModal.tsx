import React, { useEffect, useState } from 'react';
import { X, MapPin, Star, Calendar, Users, Edit, Trash2, Image as ImageIcon, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { useModalEscape } from '../../hooks/useModalEscape';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useDraggableModal } from '../../hooks/useDraggableModal';
import type { Place } from '../../types';
import { useUserStore } from '../../store/userStore';
import { useToastStore } from '../../store/toastStore';
import PlaceFormModal from './PlaceFormModal';
import ConfirmModal from './ConfirmModal';
import ReviewsList from '../ui/ReviewsList';
import GoogleMapsLink from '../ui/GoogleMapsLink';
import { ApiService } from '../../services/api';
import {
  getPlaceAdditionalImages,
  addPlaceImage,
  removePlaceImage,
  fileToBase64,
  validateImageFile
} from '../../utils/additionalImages';

type Props = {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
};

export default function PlaceDetailsModal({ place, isOpen, onClose, onUpdate }: Props) {
  const user = useUserStore((state) => state.user);
  const isAdmin = useUserStore((state) => state.isAdmin());
  const addToast = useToastStore((state) => state.addToast);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Load additional images
  useEffect(() => {
    if (isOpen) {
      const images = getPlaceAdditionalImages(place.id);
      setAdditionalImages(images);
      setImageError(false); // Reset error state when opening
    }
  }, [isOpen, place.id]);

  // Handle escape key
  useModalEscape(isOpen, onClose);

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  // Draggable modal for mobile
  const { dragHandleProps, modalStyle, isDragging } = useDraggableModal({
    isOpen,
    onClose,
    threshold: 25,
  });

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

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      await ApiService.deletePlace(place.id);
      onClose();
      onUpdate?.();
    } catch {
      addToast('Error al eliminar el lugar', 'error');
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
      addToast(error, 'error');
      return;
    }

    setIsUploadingImage(true);
    try {
      const base64 = await fileToBase64(file);
      addPlaceImage(place.id, base64);
      const updatedImages = getPlaceAdditionalImages(place.id);
      setAdditionalImages(updatedImages);
    } catch (err) {
      addToast('Error al cargar la imagen: ' + (err instanceof Error ? err.message : 'Error desconocido'), 'error');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleImageDelete = (index: number) => {
    removePlaceImage(place.id, index);
    const updatedImages = getPlaceAdditionalImages(place.id);
    setAdditionalImages(updatedImages);
    addToast('Imagen eliminada', 'success');
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-[1000] md:p-4"
        onClick={onClose}
      >
        <section
          className="bg-white dark:bg-gray-800 w-full md:rounded-2xl md:max-w-4xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300 relative rounded-t-3xl md:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="place-details-title"
          data-modal-content
          style={modalStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle */}
          <div
            className="sticky top-0 z-30 md:hidden bg-white dark:bg-gray-800 rounded-t-3xl cursor-grab active:cursor-grabbing pt-2"
            {...dragHandleProps}
          >
            <div className="flex justify-center py-3">
              <div className={`w-12 h-1.5 rounded-full transition-colors ${isDragging ? 'bg-gray-400 dark:bg-gray-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            </div>
          </div>

          {/* Hero Image Section - positioned at top */}
          <div className="relative h-56 md:h-80 w-full bg-gray-100 dark:bg-gray-700 md:rounded-t-2xl overflow-hidden -mt-2 md:mt-0">
            {/* Close Button - desktop only */}
            <button
              onClick={onClose}
              className="hidden md:flex absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50 z-20"
              aria-label="Cerrar detalles"
            >
              <X className="h-6 w-6" />
            </button>

            {!imageError && place.link_image ? (
              <img
                src={place.link_image}
                alt={`Imagen principal de ${place.name}`}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-400 dark:text-gray-500">
                <ImageIcon className="h-16 w-16 mb-3 opacity-50" />
                <span className="text-sm font-medium uppercase tracking-wider opacity-50">Sin imagen disponible</span>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Title & Key Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium border border-white/10">
                      {place.category}
                    </span>
                    {place.active && (
                      <span className="px-2.5 py-0.5 rounded-full bg-green-500/80 backdrop-blur-md text-xs font-medium text-white">
                        Activo
                      </span>
                    )}
                  </div>
                  <h2 id="place-modal-title" className="text-3xl md:text-4xl font-bold mb-2 text-shadow-sm">
                    {place.name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm md:text-base text-gray-200">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{place.location}</span>
                    </div>
                    {averageRating && (
                      <div className="flex items-center gap-1.5 text-yellow-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold text-white">{averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {place.display_number !== undefined && place.display_number !== null && place.display_number !== 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent('navigateToMapWithPlace', {
                        detail: {
                          placeId: place.id,
                          displayNumber: place.display_number,
                          latitude: place.latitude,
                          longitude: place.longitude
                        }
                      }));
                    }}
                    className="hidden md:flex h-14 w-14 bg-white/90 backdrop-blur-sm text-gray-900 rounded-2xl items-center justify-center font-bold text-2xl shadow-lg hover:scale-110 transition-transform cursor-pointer border border-white/20"
                    aria-label={`Ver lugar #${place.display_number} en el mapa`}
                    title="Ver en el mapa"
                  >
                    {place.display_number}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-8">
            {/* Main Content (Left Column) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Sobre este lugar</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                  {place.description}
                </p>
              </section>

              {/* Additional Images */}
              {isAdmin && (
                <section className="border-t border-gray-100 dark:border-gray-700 pt-6">
                  <button
                    onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                    className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium hover:underline"
                  >
                    <ImageIcon className="h-5 w-5" />
                    <span>Gestionar galería de imágenes ({additionalImages.length})</span>
                    {showAdditionalInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {showAdditionalInfo && (
                    <div className="mt-4 space-y-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                          className={`cursor-pointer flex flex-col items-center gap-3 ${isUploadingImage ? 'opacity-50' : ''
                            }`}
                        >
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                            <Upload className="h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                              {isUploadingImage ? 'Subiendo...' : 'Click para subir imagen'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG hasta 5MB</span>
                          </div>
                        </label>
                      </div>

                      {additionalImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {additionalImages.map((image, index) => (
                            <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-gray-200">
                              <img
                                src={image}
                                alt={`Galería ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => handleImageDelete(index)}
                                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-sm"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
              <ReviewsList reviews={place.reviews || []} />
            </div>

            {/* Sidebar (Right Column) */}
            <div className="space-y-6">
              {/* Map Card */}
              {place.latitude && place.longitude ? (
                <GoogleMapsLink
                  latitude={place.latitude}
                  longitude={place.longitude}
                  markerColor="blue"
                />
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-500 text-sm">
                  Ubicación no disponible
                </div>
              )}

              {/* Info Cards */}
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400 mr-3">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Categoría</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{place.category}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400 mr-3">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Registrado</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(place.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200 dark:shadow-none"
                    >
                      <Edit className="h-4 w-4" />
                      Editar Lugar
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 dark:bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 dark:hover:bg-red-700 transition-colors font-medium shadow-sm shadow-red-200 dark:shadow-none"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? 'Eliminando...' : 'Eliminar Lugar'}
                    </button>
                  </>
                ) : (
                  <>
                    {user && (
                      <button
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-bold shadow-lg shadow-gray-200 dark:shadow-none"
                      >
                        Agregar a favoritos
                      </button>
                    )}
                    <button
                      className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      Compartir lugar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
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