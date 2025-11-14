import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar as CalendarIcon, Sparkles, TrendingUp, Users, Heart, ArrowRight, Clock } from "lucide-react";
import { useDataLoading } from "../hooks/useDataLoading";
import { useUserStore } from "../store/userStore";
import { getEventStatus } from "../services/api";

export default function Home() {
  const { places, events, loading } = useDataLoading();
  const { user } = useUserStore();

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
      .slice(0, 3);
  }, [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-cyan-600 via-blue-600 to-blue-700 text-white rounded-2xl p-8 md:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAtMjBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6TTIwIDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wLTIwYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {user ? `¡Hola ${user.name}!` : '¡Bienvenido a Culturistas!'}
          </h1>
          <p className="text-lg md:text-xl text-cyan-50 mb-8">
            Descubre los mejores lugares y eventos de Cochabamba. Tu próxima aventura comienza aquí.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 bg-white text-cyan-600 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-50 transition-colors shadow-lg"
            >
              <MapPin className="h-5 w-5" />
              Explorar Lugares
            </Link>
            <Link
              to="/explore?tab=itinerario"
              className="inline-flex items-center gap-2 bg-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              Crear Itinerario
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
              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredPlaces.map((place) => (
              <Link
                key={place.id}
                to="/explore"
                className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
              >
                <div className="aspect-video bg-gradient-to-br from-cyan-400 to-blue-500 relative overflow-hidden">
                  {place.link_image ? (
                    <img
                      src={place.link_image}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-white/30" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-cyan-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {place.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {place.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {place.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-500">{place.location}</span>
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">Bs. {place.price}</span>
                  </div>
                </div>
              </Link>
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
              to="/explore?tab=eventos"
              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                to="/explore?tab=eventos"
                className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
              >
                <div className="aspect-video bg-gradient-to-br from-purple-400 to-blue-500 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CalendarIcon className="h-16 w-16 text-white/30" />
                  </div>
                  <div className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {event.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {event.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(event.event_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 md:p-12 text-center border border-cyan-100 dark:border-gray-600">
        <Users className="h-16 w-16 text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          ¿Listo para tu próxima aventura?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          {user 
            ? 'Explora lugares increíbles, participa en eventos emocionantes y crea tus propios itinerarios personalizados.'
            : 'Inicia sesión para guardar tus lugares favoritos, recibir recomendaciones personalizadas y crear itinerarios únicos.'
          }
        </p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg"
        >
          <Sparkles className="h-5 w-5" />
          Comenzar Ahora
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </div>
  );
}
