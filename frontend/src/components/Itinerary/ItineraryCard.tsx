import { Calendar, Clock, DollarSign, MapPin, Edit2, Trash2, Share2 } from "lucide-react";
import type { Itinerary } from "../../types";

type Props = {
  itinerary: Itinerary;
  onView: (itinerary: Itinerary) => void;
  onEdit: (itinerary: Itinerary) => void;
  onDelete: (itineraryId: number) => void;
  onShare?: (itinerary: Itinerary) => void;
};

export default function ItineraryCard({ itinerary, onView, onEdit, onDelete, onShare }: Props) {
  const itemCount = itinerary.items?.length || 0;
  const budgetPercentage = (itinerary.total_cost / itinerary.budget) * 100;
  
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4">
        <h3 className="font-semibold text-lg mb-1">{itinerary.name}</h3>
        <div className="flex items-center gap-2 text-sm opacity-90">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(itinerary.date).toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4 text-green-500" />
          <span>{itinerary.start_time} - {itinerary.end_time}</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <span>Presupuesto</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Bs. {itinerary.total_cost.toFixed(2)} / Bs. {itinerary.budget.toFixed(2)}
            </span>
          </div>
          
          {/* Budget Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                budgetPercentage > 100
                  ? 'bg-red-500'
                  : budgetPercentage > 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span>{itemCount} {itemCount === 1 ? 'parada' : 'paradas'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onView(itinerary)}
          className="flex-1 bg-cyan-600 dark:bg-cyan-700 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 transition-colors text-sm font-medium"
        >
          Ver Itinerario
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(itinerary);
          }}
          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          aria-label="Editar itinerario"
          title="Editar"
        >
          <Edit2 className="h-5 w-5" />
        </button>
        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(itinerary);
            }}
            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
            aria-label="Compartir itinerario"
            title="Compartir"
          >
            <Share2 className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(itinerary.id);
          }}
          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          aria-label="Eliminar itinerario"
          title="Eliminar"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}
