import { DollarSign, Clock, MapPin, TrendingUp, AlertCircle } from "lucide-react";
import type { Itinerary } from "../../types";

type Props = {
  itinerary: Itinerary;
};

export default function ItinerarySummary({ itinerary }: Props) {
  const itemCount = itinerary.items?.length || 0;
  const budgetUsedPercentage = (itinerary.total_cost / itinerary.budget) * 100;
  const isOverBudget = itinerary.total_cost > itinerary.budget;
  const remaining = itinerary.budget - itinerary.total_cost;

  // Calculate total duration
  const calculateDuration = () => {
    if (!itinerary.start_time || !itinerary.end_time) return 'N/A';
    
    const [startHour, startMin] = itinerary.start_time.split(':').map(Number);
    const [endHour, endMin] = itinerary.end_time.split(':').map(Number);
    
    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  return (
    <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
      <h3 className="text-xl font-bold mb-6 relative z-10">Resumen del Itinerario</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* Total Cost */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-emerald-300" />
            <span className="text-sm font-medium opacity-90">Costo Total</span>
          </div>
          <div className="text-2xl font-bold">Bs. {itinerary.total_cost.toFixed(2)}</div>
          <div className="text-xs opacity-75 mt-1">
            de Bs. {itinerary.budget.toFixed(2)} presupuestado
          </div>
        </div>

        {/* Budget Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            {isOverBudget ? (
              <AlertCircle className="h-5 w-5 text-red-300" />
            ) : (
              <TrendingUp className="h-5 w-5 text-emerald-300" />
            )}
            <span className="text-sm font-medium opacity-90">
              {isOverBudget ? 'Sobre Presupuesto' : 'Disponible'}
            </span>
          </div>
          <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-200' : 'text-emerald-200'}`}>
            Bs. {Math.abs(remaining).toFixed(2)}
          </div>
          <div className="w-full bg-black/20 rounded-full h-2 mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget ? 'bg-red-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-300" />
            <span className="text-sm font-medium opacity-90">Duración</span>
          </div>
          <div className="text-2xl font-bold">{calculateDuration()}</div>
          <div className="text-xs opacity-75 mt-1">
            {itinerary.start_time} - {itinerary.end_time}
          </div>
        </div>

        {/* Stops */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-purple-300" />
            <span className="text-sm font-medium opacity-90">Paradas</span>
          </div>
          <div className="text-2xl font-bold">{itemCount}</div>
          <div className="text-xs opacity-75 mt-1">
            {itemCount === 1 ? 'lugar/evento' : 'lugares/eventos'}
          </div>
        </div>
      </div>

      {/* Warning if over budget */}
      {isOverBudget && (
        <div className="mt-4 bg-red-500/20 border border-red-400/30 rounded-xl p-4 flex items-start gap-3 relative z-10 backdrop-blur-md">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-200" />
          <div className="text-sm">
            <p className="font-bold text-red-100">Presupuesto excedido</p>
            <p className="opacity-90 text-xs mt-1 text-red-50">
              El costo total supera tu presupuesto por Bs. {(itinerary.total_cost - itinerary.budget).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
