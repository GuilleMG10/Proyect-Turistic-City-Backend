import { useState, useEffect } from "react";
import { Sparkles, Calendar } from "lucide-react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import type { Itinerary, ItineraryItem, ItineraryGenerateRequest, Place, EventWithStatus } from "../../types";
import { useUserStore } from "../../store/userStore";
import EmptyState from "../ui/EmptyState";
import ErrorModal from "../modals/ErrorModal";
import ItineraryGenerateModal from "./ItineraryGenerateModal";
import ItineraryCard from "./ItineraryCard";
import ItineraryViewModal from "./ItineraryViewModal";
import ItineraryEditModal from "./ItineraryEditModal";
import ConfirmModal from "../modals/ConfirmModal";
import GeneratingModal from "./GeneratingModal";
import { ItineraryService } from "../../services/itineraryService";
import { ApiService } from "../../services/api";

type Props = {
  places: Place[];
};

export default function ItineraryTab({ places }: Props) {
  const { user } = useUserStore();
  // Itineraries loaded from API - starts empty
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [events, setEvents] = useState<EventWithStatus[]>([]);

  // Load itineraries and events from API on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const [itinerariesData, eventsData] = await Promise.all([
          ItineraryService.getItineraries(),
          ApiService.getEvents()
        ]);
        setItineraries(itinerariesData);
        setEvents(eventsData);
      } catch (err) {
        console.error('Error loading data:', err);
        // Don't show error for empty itineraries, just set empty array
        setItineraries([]);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleGenerate = async (formData: ItineraryGenerateRequest) => {
    if (!user) return;

    setIsGenerating(true);

    try {
      // Call AI service to generate itinerary
      const result = await ItineraryService.generateItinerary(
        formData,
        () => {
          // Progress callback (not displayed but kept for future use)
        }
      );

      // Fetch places and events to populate items
      const [placesData, eventsData] = await Promise.all([
        ApiService.getPlaces(),
        ApiService.getEvents()
      ]);

      // Build itinerary items for saving
      const items = result.items.map((item, index) => {
        if (item.type === 'place') {
          return {
            place_id: item.item_id,
            event_id: null,
            order: index + 1,
            start_time: item.start_time,
            end_time: item.end_time,
            notes: item.notes,
          };
        } else {
          return {
            place_id: null,
            event_id: item.item_id,
            order: index + 1,
            start_time: item.start_time,
            end_time: item.end_time,
            notes: item.notes,
          };
        }
      });

      // Save itinerary to backend
      const savedItinerary = await ApiService.createItinerary({
        user_id: user.id,
        name: `Itinerario ${new Date(formData.date).toLocaleDateString('es-ES')}`,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        budget: formData.budget,
        preferences: JSON.stringify(formData.preferences),
        total_cost: result.total_cost,
        items: items as ItineraryItem[],
      });

      // Populate items with full place/event data for display
      if (savedItinerary.items) {
        savedItinerary.items = savedItinerary.items.map(item => ({
          ...item,
          place: item.place_id ? placesData.find(p => p.id === item.place_id) : undefined,
          event: item.event_id ? eventsData.find(e => e.id === item.event_id) : undefined,
        }));
      }

      // Add to itineraries list
      setItineraries(prev => [savedItinerary, ...prev]);
      
      // Show the new itinerary
      setSelectedItinerary(savedItinerary);
      setIsViewModalOpen(true);
      setIsGenerateModalOpen(false);
      
    } catch (error) {
      console.error('Error generating itinerary:', error);
      setError({
        title: '¡Oh no! Algo salio mal...',
        message: error instanceof Error ? error.message : 'No se pudo generar el itinerario. Por favor verifica tu conexión e intenta de nuevo.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleView = (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary);
    setIsViewModalOpen(true);
  };

  const handleEdit = (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary);
    setIsEditModalOpen(true);
  };

  const handleDelete = (itineraryId: number) => {
    setItineraryToDelete(itineraryId);
  };

  const confirmDelete = async () => {
    if (itineraryToDelete) {
      try {
        await ItineraryService.deleteItinerary(itineraryToDelete);
        setItineraries(prev => prev.filter(it => it.id !== itineraryToDelete));
        setItineraryToDelete(null);
      } catch (err) {
        console.error('Error al eliminar itinerario:', err);
        setError({
          title: 'Error al eliminar',
          message: 'No se pudo eliminar el itinerario. Por favor, intenta de nuevo.',
        });
        setItineraryToDelete(null);
      }
    }
  };

  const handleShare = (itinerary: Itinerary) => {
    console.log('Compartir itinerario:', itinerary);
    // TODO: Implementar funcionalidad de compartir
  };

  const handleSaveItinerary = (updatedItinerary: Itinerary) => {
    setItineraries(prev => 
      prev.map(it => it.id === updatedItinerary.id ? updatedItinerary : it)
    );
    console.log('Itinerario actualizado:', updatedItinerary);
    // TODO: Conectar con API para guardar cambios
  };

  // Lock body scroll when generate modal is open
  useBodyScrollLock(isGenerateModalOpen);

  if (!user) {
    return <EmptyState type="no-user-itinerary" />;
  }

  return (
    <main className="space-y-6">
      {/* Header with Generate Button */}
      <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm dark:shadow-slate-900/50 p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Itinerarios</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Crea y gestiona tus rutas turísticas personalizadas
            </p>
          </div>
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 font-semibold"
            aria-label="Generar nuevo itinerario con IA"
          >
            <Sparkles className="h-5 w-5" />
            <span>Generar</span>
          </button>
        </div>
      </section>

      {/* Itineraries List or Empty State */}
      {isLoading ? (
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 p-12 text-center border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">Cargando itinerarios...</p>
          </div>
        </section>
      ) : itineraries.length === 0 ? (
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 p-12 text-center border border-slate-200 dark:border-slate-700">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              No tienes itinerarios aún
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Crea tu primer itinerario personalizado con ayuda de nuestro asistente interactivo.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">
              Usa el botón <span className="font-semibold text-blue-600 dark:text-blue-400">"Generar"</span> de arriba para comenzar.
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {itineraries.map((itinerary) => (
            <ItineraryCard
              key={itinerary.id}
              itinerary={itinerary}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ))}
        </section>
      )}

      {/* Generate Modal */}
      <ItineraryGenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={handleGenerate}
        places={places}
      />

      {/* View Modal */}
      {selectedItinerary && (
        <ItineraryViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedItinerary(null);
          }}
          itinerary={selectedItinerary}
          onSave={handleSaveItinerary}
          onDelete={(itemId) => {
            // Remove item from itinerary
            if (selectedItinerary) {
              const updatedItinerary = {
                ...selectedItinerary,
                items: selectedItinerary.items?.filter(item => item.id !== itemId)
              };
              handleSaveItinerary(updatedItinerary);
              setSelectedItinerary(updatedItinerary);
            }
          }}
          availablePlaces={places}
          availableEvents={events}
        />
      )}

      {/* Edit Modal (opened directly from card) */}
      {selectedItinerary && (
        <ItineraryEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedItinerary(null);
          }}
          itinerary={selectedItinerary}
          onSave={(updated) => {
            handleSaveItinerary(updated);
            setIsEditModalOpen(false);
            setSelectedItinerary(null);
          }}
          availablePlaces={places}
          availableEvents={events}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={itineraryToDelete !== null}
        onCancel={() => setItineraryToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar Itinerario"
        message="¿Estás seguro de que deseas eliminar este itinerario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Generating Modal */}
      <GeneratingModal
        isOpen={isGenerating}
      />

      {/* Error Modal */}
      {error && (
        <ErrorModal
          isOpen={true}
          onClose={() => setError(null)}
          title={error.title}
          message={error.message}
        />
      )}
    </main>
  );
}
