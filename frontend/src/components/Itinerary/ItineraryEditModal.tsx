import { useState, useMemo } from "react";
import { X, Save, Plus, MapPin, Calendar as CalendarIcon, Search, Clock } from "lucide-react";
import { useModalEscape } from "../../hooks/useModalEscape";
import type { Itinerary, ItineraryItem, Place, Event } from "../../types";
import DatePicker from "../ui/DatePicker";

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
  onSave,
  availablePlaces = [],
  availableEvents = []
}: Props) {
  const [editedItinerary, setEditedItinerary] = useState<Itinerary>(itinerary);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'place' | 'event'>('place');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Place | Event | null>(null);
  const [newItemTime, setNewItemTime] = useState({ start: '09:00', end: '11:00' });
  const [newItemNotes, setNewItemNotes] = useState('');

  // Filter available items based on search and what's already in itinerary
  const filteredPlaces = useMemo(() => {
    const existingPlaceIds = new Set(editedItinerary.items?.filter(i => i.place_id).map(i => i.place_id));
    return availablePlaces.filter(place => 
      !existingPlaceIds.has(place.id) &&
      place.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availablePlaces, editedItinerary.items, searchQuery]);

  const filteredEvents = useMemo(() => {
    const existingEventIds = new Set(editedItinerary.items?.filter(i => i.event_id).map(i => i.event_id));
    return availableEvents.filter(event => 
      !existingEventIds.has(event.id) &&
      event.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableEvents, editedItinerary.items, searchQuery]);

  const handleAddItem = () => {
    if (!selectedItem) return;

    const isPlace = addType === 'place';
    const newItem: ItineraryItem = {
      id: Date.now(), // Temporary ID for new items
      itinerary_id: editedItinerary.id,
      place_id: isPlace ? selectedItem.id : null,
      event_id: isPlace ? null : selectedItem.id,
      order: (editedItinerary.items?.length || 0) + 1,
      start_time: newItemTime.start,
      end_time: newItemTime.end,
      notes: newItemNotes,
      place: isPlace ? (selectedItem as Place) : undefined,
      event: isPlace ? undefined : (selectedItem as Event & { status: 'upcoming' }),
    };

    setEditedItinerary(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
      total_cost: prev.total_cost + (selectedItem.price || 0)
    }));

    // Reset modal state
    setSelectedItem(null);
    setNewItemTime({ start: '09:00', end: '11:00' });
    setNewItemNotes('');
    setSearchQuery('');
    setShowAddModal(false);
  };

  const resetAddModal = () => {
    setSelectedItem(null);
    setNewItemTime({ start: '09:00', end: '11:00' });
    setNewItemNotes('');
    setSearchQuery('');
    setShowAddModal(false);
  };

  // Handle escape key (only when nested modal is closed)
  useModalEscape(isOpen && !showAddModal, onClose);

  const handleSave = () => {
    onSave(editedItinerary);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 md:p-6 rounded-t-2xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5" />
          <div className="flex items-center gap-2 md:gap-3 relative z-10">
            <div className="p-2 bg-white/20 rounded-xl">
              <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-white">Editar Itinerario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors relative z-10 text-white"
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
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
            />
          </section>

          {/* Date and Times */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <DatePicker
                value={editedItinerary.date}
                onChange={(date) => setEditedItinerary(prev => ({ ...prev, date }))}
                label="Fecha"
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
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
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
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
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
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
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
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar</span>
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900/50">
              {editedItinerary.items?.map((item, index) => {
                const isPlace = item.place_id !== null;
                const itemData = isPlace ? item.place : item.event;
                if (!itemData) return null;

                return (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-bold">
                        {index + 1}
                      </span>
                      <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{itemData.name}</p>
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
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors"
                      aria-label="Eliminar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              
              {(!editedItinerary.items || editedItinerary.items.length === 0) && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
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
              className="flex-1 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3.5 bg-blue-600 dark:bg-blue-700 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5"
            >
              <Save className="h-5 w-5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Item Modal (nested) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Agregar Lugar o Evento
              </h3>
              <button
                onClick={resetAddModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-180px)]">
              {/* Type Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <button
                  onClick={() => { setAddType('place'); setSelectedItem(null); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    addType === 'place'
                      ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Lugares ({filteredPlaces.length})
                </button>
                <button
                  onClick={() => { setAddType('event'); setSelectedItem(null); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    addType === 'event'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Eventos ({filteredEvents.length})
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Buscar ${addType === 'place' ? 'lugares' : 'eventos'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(addType === 'place' ? filteredPlaces : filteredEvents).length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">
                    No hay {addType === 'place' ? 'lugares' : 'eventos'} disponibles
                  </p>
                ) : (
                  (addType === 'place' ? filteredPlaces : filteredEvents).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedItem?.id === item.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
                          {item.category}
                        </span>
                      </div>
                      {item.price > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                          Bs. {item.price.toFixed(2)}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Time Selection (only show when item selected) */}
              {selectedItem && (
                <div className="space-y-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Seleccionado: {selectedItem.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Hora Inicio
                      </label>
                      <input
                        type="time"
                        value={newItemTime.start}
                        onChange={(e) => setNewItemTime(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Hora Fin
                      </label>
                      <input
                        type="time"
                        value={newItemTime.end}
                        onChange={(e) => setNewItemTime(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notas (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: No olvidar llevar cámara"
                      value={newItemNotes}
                      onChange={(e) => setNewItemNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={resetAddModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItem}
                disabled={!selectedItem}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
