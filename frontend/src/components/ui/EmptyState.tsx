import React from 'react';
import { MapPin, Search, Heart, Route, Sparkles, TrendingUp, Calendar } from 'lucide-react';

type EmptyStateType = 'no-user' | 'no-favorites' | 'no-results' | 'no-places' | 'no-events' | 'no-user-itinerary' | 'no-itineraries' | 'no-ai-suggestions' | 'no-popular';

type Props = {
  type: EmptyStateType;
  message?: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ type, message, description, action }: Props) {
  const getConfig = () => {
    switch (type) {
      case 'no-user':
        return {
          icon: Heart,
          title: "Inicia sesión para ver tus favoritos",
          desc: "Guarda lugares y eventos que te interesen para verlos aquí",
          color: "text-red-400 bg-red-50 dark:bg-red-900/20"
        };
      case 'no-user-itinerary':
        return {
          icon: Route,
          title: "Inicia sesión para crear itinerarios",
          desc: "Planifica tu visita perfecta a Cochabamba con rutas personalizadas",
          color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
        };
      case 'no-itineraries':
        return {
          icon: Sparkles,
          title: "No tienes itinerarios aún",
          desc: "Crea tu primer itinerario personalizado con ayuda de nuestro asistente IA",
          color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20"
        };
      case 'no-favorites':
        return {
          icon: Heart,
          title: "Aún no tienes favoritos",
          desc: "Explora lugares y eventos, y marca los que te gusten como favoritos",
          color: "text-red-400 bg-red-50 dark:bg-red-900/20"
        };
      case 'no-ai-suggestions':
        return {
          icon: Sparkles,
          title: "Aún no tenemos recomendaciones",
          desc: "Agrega algunos favoritos para que podamos sugerirte contenido personalizado",
          color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20"
        };
      case 'no-popular':
        return {
          icon: TrendingUp,
          title: "No hay contenido popular aún",
          desc: "Pronto aparecerán aquí los lugares y eventos más visitados",
          color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20"
        };
      case 'no-results':
        return {
          icon: Search,
          title: "No se encontraron resultados",
          desc: "Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas",
          color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
        };
      case 'no-places':
        return {
          icon: MapPin,
          title: "No hay lugares disponibles",
          desc: "Parece que no hay lugares para mostrar en este momento",
          color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
        };
      case 'no-events':
        return {
          icon: Calendar,
          title: "No hay eventos disponibles",
          desc: "No encontramos eventos que coincidan con tu búsqueda",
          color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20"
        };
      default:
        return {
          icon: Search,
          title: "Nada por aquí",
          desc: "No hay contenido para mostrar",
          color: "text-gray-400 bg-gray-50 dark:bg-gray-800"
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className={`p-4 rounded-full mb-4 ${config.color}`}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {message || config.title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
        {description || config.desc}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}