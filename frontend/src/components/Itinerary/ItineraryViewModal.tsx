import { useState, useEffect } from "react";
import { X, Save, Edit2, MapPin, Navigation, Calendar, Clock } from "lucide-react";
import type { Itinerary, ItineraryItem, Place, EventWithStatus } from "../../types";
import ItineraryTimeline from "./ItineraryTimeline";
import ItinerarySummary from "./ItinerarySummary";
import ItineraryEditModal from "./ItineraryEditModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itinerary: Itinerary;
  onSave?: (updatedItinerary: Itinerary) => void;
  onDelete?: (itemId: number) => void;
  availablePlaces?: Place[];
  availableEvents?: EventWithStatus[];
};

export default function ItineraryViewModal({ 
  isOpen, 
  onClose, 
  itinerary,
  onSave,
  onDelete,
  availablePlaces = [],
  availableEvents = []
}: Props) {
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditMode) onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isEditMode, onClose]);

  const handleRemoveItem = (itemId: number) => {
    if (onDelete) {
      onDelete(itemId);
    }
  };

  const handleViewDetails = (item: ItineraryItem) => {
    // TODO: Open place/event detail modal
    console.log('Ver detalles de:', item);
  };

  const handleSaveEdit = (updatedItinerary: Itinerary) => {
    if (onSave) {
      onSave(updatedItinerary);
    }
    setIsEditMode(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <header className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 md:p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold mb-2 truncate">{itinerary.name}</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm opacity-90">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(itinerary.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {itinerary.start_time} - {itinerary.end_time}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditMode(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Editar itinerario"
                  title="Editar"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Summary */}
            <ItinerarySummary itinerary={itinerary} />

            {/* Map Preview */}
            {itinerary.items && itinerary.items.length > 0 && (
              <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    Ruta del Itinerario
                  </h3>
                  <button className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    <Navigation className="h-4 w-4" />
                    Ver en Mapa
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {itinerary.items.length} paradas en tu recorrido
                </p>
              </section>
            )}

            {/* Timeline */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
                Itinerario Detallado
              </h3>
              {itinerary.items && itinerary.items.length > 0 ? (
                <ItineraryTimeline
                  items={itinerary.items}
                  onRemoveItem={handleRemoveItem}
                  onViewDetails={handleViewDetails}
                />
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>Este itinerario aún no tiene lugares o eventos</p>
                </div>
              )}
            </section>

            {/* Actions */}
            <section className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={() => console.log('Exportar itinerario')}
                className="flex-1 px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                <span>Exportar a Calendario</span>
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditMode && (
        <ItineraryEditModal
          isOpen={isEditMode}
          onClose={() => setIsEditMode(false)}
          itinerary={itinerary}
          onSave={handleSaveEdit}
          availablePlaces={availablePlaces}
          availableEvents={availableEvents}
        />
      )}
    </>
  );
}
