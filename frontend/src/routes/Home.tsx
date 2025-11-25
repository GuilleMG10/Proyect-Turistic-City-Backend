import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Calendar as CalendarIcon, TrendingUp, Heart, ArrowRight } from "lucide-react";
import { useDataLoading } from "../hooks/useDataLoading";
import { useUserStore } from "../store/userStore";
import { getEventStatus } from "../services/api";
import PlaceCard from "../components/cards/PlaceCard";
import EventCard from "../components/cards/EventCard";
import { useFavorites } from "../hooks/useFavorites";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function Home() {
  const { places, events, loading } = useDataLoading();
  const { user } = useUserStore();
  const navigate = useNavigate();
  const toggleFavorite = useFavorites((state) => state.toggleFavorite);

  // Calculate stats using useMemo
  const stats = useMemo(() => {
    if (places.length === 0 || events.length === 0) {
      return {
        totalPlaces: 0,
        totalEvents: 0,
        upcomingEvents: 0,
        categories: 0
      };
    }

    const categories = new Set(places.map(p => p.category));
    const upcoming = events.filter(e => getEventStatus(e.event_date) === 'upcoming');
    
    return {
      totalPlaces: places.length,
      totalEvents: events.length,
      upcomingEvents: upcoming.length,
      categories: categories.size
    };
  }, [places, events]);

  // Get featured places (first 3)
  const featuredPlaces = useMemo(() => {
    if (places.length === 0) return [];
    return places.slice(0, 3);
  }, [places]);

  // Get next 3 upcoming events
  const upcomingEvents = useMemo(() => {
    if (events.length === 0) return [];
    const upcoming = events.filter(e => getEventStatus(e.event_date) === 'upcoming');
    return upcoming
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 3)
      .map(e => ({ ...e, status: 'upcoming' as const }));
  }, [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" text="Espera..." />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white rounded-2xl p-8 md:p-12 overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAtMjBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6TTIwIDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wLTIwYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {user ? `¡Hola ${user.name}!` : '¡Bienvenido a Culturistas!'}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 leading-relaxed">
            Descubre los mejores lugares y eventos de Cochabamba. Tu próxima aventura comienza aquí.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-3">
            <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalPlaces}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Lugares</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-3">
            <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.totalEvents}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Eventos</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg mb-3">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.upcomingEvents}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Próximos</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg mb-3">
            <Heart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.categories}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Categorías</div>
        </div>
      </section>

      {/* Featured Places */}
      {featuredPlaces.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lugares Destacados</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Descubre los sitios más populares</p>
            </div>
            <Link
              to="/explore"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredPlaces.map((place) => (
              <PlaceCard 
                key={place.id} 
                place={place} 
                onInterest={(p) => user && toggleFavorite(user.id, p.id)}
                onView={() => navigate('/explore')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Próximos Eventos</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">No te pierdas estas actividades</p>
            </div>
            <Link
              to="/explore/events"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onView={() => navigate('/explore/events')}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
