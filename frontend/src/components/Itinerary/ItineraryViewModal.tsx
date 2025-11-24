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
        <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <header className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-4 md:p-6 rounded-t-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold mb-2 truncate">{itinerary.name}</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm opacity-90">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span className="capitalize">
                      {new Date(itinerary.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
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
                  className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
                  aria-label="Editar itinerario"
                  title="Editar"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
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
              <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary-500" />
                    Ruta del Itinerario
                  </h3>
                  <button className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors">
                    <Navigation className="h-4 w-4" />
                    Ver en Mapa
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {itinerary.items.length} paradas en tu recorrido
                </p>
              </section>
            )}

            {/* Timeline */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">
                Itinerario Detallado
              </h3>
              {itinerary.items && itinerary.items.length > 0 ? (
                <ItineraryTimeline
                  items={itinerary.items}
                  onRemoveItem={handleRemoveItem}
                  onViewDetails={handleViewDetails}
                />
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <p>Este itinerario aún no tiene lugares o eventos</p>
                </div>
              )}
            </section>

            {/* Actions */}
            <section className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold"
              >
                Cerrar
              </button>
              <button
                onClick={() => console.log('Exportar itinerario')}
                className="flex-1 px-6 py-3.5 bg-emerald-600 dark:bg-emerald-700 text-white rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:-translate-y-0.5"
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
