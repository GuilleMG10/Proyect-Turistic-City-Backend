import { useState } from "react";
import { X, Save, Plus, MapPin, Calendar as CalendarIcon } from "lucide-react";
import type { Itinerary, Place, Event } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itinerary: Itinerary;
  onSave: (updatedItinerary: Itinerary) => void;
  availablePlaces: Place[];
  availableEvents: Event[];
};

export default function ItineraryEditModal({ 
  isOpen, 
  onClose, 
  itinerary, 
  onSave
}: Props) {
  const [editedItinerary, setEditedItinerary] = useState<Itinerary>(itinerary);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSave = () => {
    onSave(editedItinerary);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <header className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 md:p-6 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <CalendarIcon className="h-5 w-5 md:h-6 md:w-6" />
            <h2 className="text-lg md:text-2xl font-bold">Editar Itinerario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        {/* Form */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Name */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del Itinerario
            </label>
            <input
              type="text"
              value={editedItinerary.name}
              onChange={(e) => setEditedItinerary(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </section>

          {/* Date and Times */}
          <section className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={editedItinerary.date}
                onChange={(e) => setEditedItinerary(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora Inicio
              </label>
              <input
                type="time"
                value={editedItinerary.start_time}
                onChange={(e) => setEditedItinerary(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora Fin
              </label>
              <input
                type="time"
                value={editedItinerary.end_time}
                onChange={(e) => setEditedItinerary(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </section>

          {/* Budget */}
          <section>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Presupuesto (Bs.)
            </label>
            <input
              type="number"
              value={editedItinerary.budget}
              onChange={(e) => setEditedItinerary(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </section>

          {/* Items List */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lugares y Eventos ({editedItinerary.items?.length || 0})
              </label>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 dark:bg-green-700 text-white text-sm rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar</span>
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
              {editedItinerary.items?.map((item, index) => {
                const isPlace = item.place_id !== null;
                const itemData = isPlace ? item.place : item.event;
                if (!itemData) return null;

                return (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                      <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{itemData.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {item.start_time} - {item.end_time}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditedItinerary(prev => ({
                          ...prev,
                          items: prev.items?.filter(i => i.id !== item.id)
                        }));
                      }}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded"
                      aria-label="Eliminar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              
              {(!editedItinerary.items || editedItinerary.items.length === 0) && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                  No hay items en este itinerario
                </p>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Item Modal (nested) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Agregar Lugar o Evento</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Funcionalidad de agregar items manualmente será implementada próximamente
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
