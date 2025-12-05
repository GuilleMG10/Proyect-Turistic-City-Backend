import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Calendar as CalendarIcon, TrendingUp, Heart, ArrowRight } from "lucide-react";
import { useDataLoading } from "../hooks/useDataLoading";
import { useUserStore } from "../store/userStore";
import { getEventStatus } from "../services/api";
import PlaceCard from "../components/cards/PlaceCard";
import EventCard from "../components/cards/EventCard";
import { useFavorites } from "../store/favoritesStore";
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
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Decorative pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wLTIwYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0yMCAzNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMC0yMGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
        
        {/* Floating decorative icons */}
        <div className="absolute top-6 right-8 md:right-16 opacity-20">
          <MapPin className="h-16 w-16 md:h-24 md:w-24" />
        </div>
        <div className="absolute bottom-8 right-1/4 opacity-15 hidden md:block">
          <CalendarIcon className="h-12 w-12" />
        </div>
        
        <div className="relative z-10 max-w-3xl">
          {/* Greeting badge */}
          {user && (
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-4 border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Bienvenido de nuevo
            </div>
          )}
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight leading-tight">
            {user ? (
              <>
                ¡Hola <span className="bg-gradient-to-r from-cyan-200 to-orange-200 bg-clip-text text-transparent">{user.name}</span>!
              </>
            ) : (
              <>
                ¡Bienvenido a <span className="bg-gradient-to-r from-cyan-200 to-orange-200 bg-clip-text text-transparent">Culturistas</span>!
              </>
            )}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-2xl">
            Descubre los mejores lugares y eventos de Cochabamba. Tu próxima aventura comienza aquí.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <MapPin className="h-5 w-5" />
              Explorar lugares
            </Link>
            <Link
              to="/explore/events"
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/30"
            >
              <CalendarIcon className="h-5 w-5" />
              Ver eventos
            </Link>
          </div>
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
