import React, { useEffect, useState } from 'react';
import { X, MapPin, Star, Calendar, Users, Edit, Trash2, Image as ImageIcon, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import type { Place } from '../../types';
import { useUserStore } from '../../store/userStore';
import PlaceFormModal from './PlaceFormModal';
import ConfirmModal from './ConfirmModal';
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
        onClick={onClose}
      >
      <section 
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="place-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Image Section */}
        <div className="relative h-64 md:h-80 w-full bg-gray-100 dark:bg-gray-700">
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

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Cerrar detalles"
          >
            <X className="h-6 w-6" />
          </button>

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
              
              {place.display_number && (
                <div className="hidden md:flex h-14 w-14 bg-white text-primary-600 rounded-2xl items-center justify-center font-bold text-2xl shadow-lg">
                  {place.display_number}
                </div>
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
                        className={`cursor-pointer flex flex-col items-center gap-3 ${
                          isUploadingImage ? 'opacity-50' : ''
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
            {place.reviews && place.reviews.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  Reseñas
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                    ({place.reviews.length})
                  </span>
                </h3>
                <div className="grid gap-4">
                  {place.reviews.map((review) => (
                    <article key={review.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={review.created_at}>
                          {new Date(review.created_at).toLocaleDateString('es-ES')}
                        </time>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">"{review.comment}"</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar (Right Column) */}
          <div className="space-y-6">
            {/* Map Card */}
            <div className="bg-gray-50 dark:bg-gray-700/30 p-1 rounded-2xl border border-gray-100 dark:border-gray-700">
              {place.latitude && place.longitude ? (
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-200 group cursor-pointer"
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${place.latitude},${place.longitude}`;
                    window.open(url, '_blank');
                  }}
                >
                  {/* Placeholder Map Pattern */}
                  <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover opacity-10 dark:opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                      <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400 drop-shadow-md" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs font-medium text-center text-blue-600 dark:text-blue-400 group-hover:underline">
                      Ver en Google Maps
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Ubicación no disponible
                </div>
              )}
            </div>

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
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-red-600 border border-red-200 dark:border-red-900/50 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
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