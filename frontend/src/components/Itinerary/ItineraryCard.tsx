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
    <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300 group">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <h3 className="font-bold text-lg mb-1 relative z-10">{itinerary.name}</h3>
        <div className="flex items-center gap-2 text-sm opacity-90 relative z-10">
          <Calendar className="h-4 w-4" />
          <span className="capitalize">
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
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Clock className="h-4 w-4 text-blue-500" />
          <span>{itinerary.start_time} - {itinerary.end_time}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <span>Presupuesto</span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              Bs. {itinerary.total_cost.toFixed(2)} / Bs. {itinerary.budget.toFixed(2)}
            </span>
          </div>
          
          {/* Budget Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out rounded-full ${
                budgetPercentage > 100
                  ? 'bg-red-500'
                  : budgetPercentage > 80
                  ? 'bg-orange-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span>{itemCount} {itemCount === 1 ? 'parada' : 'paradas'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={() => onView(itinerary)}
          className="flex-1 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          Ver Itinerario
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(itinerary);
          }}
          className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
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
            className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-colors"
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
          className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
          aria-label="Eliminar itinerario"
          title="Eliminar"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}
