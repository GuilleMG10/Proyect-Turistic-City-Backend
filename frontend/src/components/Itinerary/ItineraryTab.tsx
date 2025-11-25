import { useState, useEffect } from "react";
import { Sparkles, Calendar } from "lucide-react";
import type { Itinerary, ItineraryGenerateRequest } from "../../types";
import { useUserStore } from "../../store/userStore";
import EmptyState from "../ui/EmptyState";
import ErrorModal from "../modals/ErrorModal";
import ItineraryGenerateModal from "./ItineraryGenerateModal";
import ItineraryCard from "./ItineraryCard";
import ItineraryViewModal from "./ItineraryViewModal";
import ConfirmModal from "../modals/ConfirmModal";
import GeneratingModal from "./GeneratingModal";
import { ItineraryService } from "../../services/itineraryService";
import { ApiService } from "../../services/api";

export default function ItineraryTab() {
  const { user } = useUserStore();
  // Itineraries loaded from API - starts empty
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  // Load itineraries from API on mount
  useEffect(() => {
    const loadItineraries = async () => {
      if (!user) {
        return;
      }
      
      try {
        const data = await ItineraryService.getItineraries();
        setItineraries(data);
      } catch (err) {
        console.error('Error loading itineraries:', err);
        // Don't show error for empty itineraries, just set empty array
        setItineraries([]);
      }
    };

    loadItineraries();
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
      const [places, events] = await Promise.all([
        ApiService.getPlaces(),
        ApiService.getEvents()
      ]);

      // Convert generated result to Itinerary format
      const newItinerary: Itinerary = {
        id: Date.now(), // Temporary ID
        user_id: user.id,
        name: `Itinerario ${new Date(formData.date).toLocaleDateString('es-ES')}`,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        budget: formData.budget,
        preferences: JSON.stringify(formData.preferences),
        total_cost: result.total_cost,
        created_at: new Date().toISOString(),
        items: result.items.map((item, index) => {
          if (item.type === 'place') {
            const place = places.find(p => p.id === item.item_id);
            return {
              id: Date.now() + index,
              itinerary_id: Date.now(),
              place_id: item.item_id,
              event_id: null,
              order: index + 1,
              start_time: item.start_time,
              end_time: item.end_time,
              notes: item.notes,
              place: place,
              event: undefined,
            };
          } else {
            const event = events.find(e => e.id === item.item_id);
            return {
              id: Date.now() + index,
              itinerary_id: Date.now(),
              place_id: null,
              event_id: item.item_id,
              order: index + 1,
              start_time: item.start_time,
              end_time: item.end_time,
              notes: item.notes,
              place: undefined,
              event: event,
            };
          }
        })
      };

      // Add to itineraries list
      setItineraries(prev => [newItinerary, ...prev]);
      
      // Show the new itinerary
      setSelectedItinerary(newItinerary);
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
    setIsViewModalOpen(true);
  };

  const handleDelete = (itineraryId: number) => {
    setItineraryToDelete(itineraryId);
  };

  const confirmDelete = () => {
    if (itineraryToDelete) {
      setItineraries(prev => prev.filter(it => it.id !== itineraryToDelete));
      setItineraryToDelete(null);
      console.log('Itinerario eliminado:', itineraryToDelete);
      // TODO: Conectar con API para eliminar
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isGenerateModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isGenerateModalOpen]);

  if (!user) {
    return <EmptyState type="no-user" />;
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
            <span>Generar con IA</span>
          </button>
        </div>
      </section>

      {/* Itineraries List or Empty State */}
      {itineraries.length === 0 ? (
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 p-12 text-center border border-slate-200 dark:border-slate-700">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              No tienes itinerarios aún
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Crea tu primer itinerario personalizado con ayuda de nuestra IA.
              Te ayudaremos a planificar tu visita perfecta a Cochabamba.
            </p>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-8 py-4 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-800 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 font-bold text-lg"
            >
              <Sparkles className="h-6 w-6" />
              <span>Crear Primer Itinerario</span>
            </button>
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
      />

      {/* View/Edit Modal */}
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
