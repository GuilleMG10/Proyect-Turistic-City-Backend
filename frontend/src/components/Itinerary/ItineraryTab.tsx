import { useState, useEffect } from "react";
import { Sparkles, Calendar } from "lucide-react";
import type { Itinerary, ItineraryGenerateRequest } from "../../types";
import { useUserStore } from "../../store/userStore";
import EmptyState from "../EmptyState";
import ErrorModal from "../ErrorModal";
import ItineraryGenerateModal from "./ItineraryGenerateModal";
import ItineraryCard from "./ItineraryCard";
import ItineraryViewModal from "./ItineraryViewModal";
import ConfirmModal from "../ConfirmModal";
import GeneratingModal from "./GeneratingModal";
import { ItineraryService } from "../../services/itineraryService";
import { ApiService } from "../../services/api";

export default function ItineraryTab() {
  const { user } = useUserStore();
  // TODO: Replace with actual API data
  const [itineraries, setItineraries] = useState<Itinerary[]>([
    {
      id: 1,
      user_id: user?.id || 1,
      name: "Tour Centro Histórico",
      date: "2025-11-15",
      start_time: "09:00",
      end_time: "17:00",
      budget: 500,
      preferences: JSON.stringify(["Cultural", "Historia", "Gastronomía"]),
      total_cost: 380,
      created_at: new Date().toISOString(),
      items: [
        {
          id: 1,
          itinerary_id: 1,
          place_id: 1,
          event_id: null,
          order: 1,
          start_time: "09:00",
          end_time: "11:00",
          notes: "Visita guiada incluida",
          place: {
            id: 1,
            user_id: 1,
            name: "Cristo de la Concordia",
            description: "Monumento emblemático de Cochabamba",
            location: "Cerro San Pedro",
            latitude: -17.3935,
            longitude: -66.1450,
            category: "Cultural",
            price: 20,
            created_at: new Date().toISOString(),
            link_image: null,
            active: true
          }
        },
        {
          id: 2,
          itinerary_id: 1,
          place_id: 2,
          event_id: null,
          order: 2,
          start_time: "11:30",
          end_time: "13:00",
          notes: "Almuerzo tradicional",
          place: {
            id: 2,
            user_id: 1,
            name: "La Cancha",
            description: "Mercado más grande de Bolivia",
            location: "Zona La Cancha",
            latitude: -17.3928,
            longitude: -66.1570,
            category: "Gastronomía",
            price: 150,
            created_at: new Date().toISOString(),
            link_image: null,
            active: true
          }
        },
        {
          id: 3,
          itinerary_id: 1,
          place_id: 3,
          event_id: null,
          order: 3,
          start_time: "14:00",
          end_time: "16:30",
          notes: "Recorrido histórico",
          place: {
            id: 3,
            user_id: 1,
            name: "Plaza 14 de Septiembre",
            description: "Plaza principal de Cochabamba",
            location: "Centro",
            latitude: -17.3935,
            longitude: -66.1570,
            category: "Historia",
            price: 0,
            created_at: new Date().toISOString(),
            link_image: null,
            active: true
          }
        }
      ]
    },
    {
      id: 2,
      user_id: user?.id || 1,
      name: "Aventura en Naturaleza",
      date: "2025-11-20",
      start_time: "08:00",
      end_time: "18:00",
      budget: 800,
      preferences: JSON.stringify(["Naturaleza", "Deportes", "Entretenimiento"]),
      total_cost: 650,
      created_at: new Date().toISOString(),
      items: []
    }
  ]);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  const handleGenerate = async (formData: ItineraryGenerateRequest) => {
    if (!user) return;

    setIsGenerating(true);
    setGenerationProgress("Iniciando generación del itinerario...");

    try {
      // Call AI service to generate itinerary
      const result = await ItineraryService.generateItinerary(
        formData,
        (text) => {
          setGenerationProgress(prev => prev + text);
        }
      );

      setGenerationProgress("¡Itinerario generado exitosamente!");

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
      setGenerationProgress("");
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
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Itinerarios</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Crea y gestiona tus rutas turísticas personalizadas
            </p>
          </div>
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            aria-label="Generar nuevo itinerario con IA"
          >
            <Sparkles className="h-5 w-5" />
            <span>Generar</span>
          </button>
        </div>
      </section>

      {/* Itineraries List or Empty State */}
      {itineraries.length === 0 ? (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-12 text-center">
          <div className="max-w-md mx-auto">
            <Calendar className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No tienes itinerarios aún
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Crea tu primer itinerario personalizado con ayuda de nuestra IA.
              Te ayudaremos a planificar tu visita perfecta a Cochabamba.
            </p>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-cyan-600 dark:bg-cyan-700 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              <span>Crear Primer Itinerario</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        progress={generationProgress}
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
