import { useState } from "react";
import { Heart, Sparkles, MapPin } from "lucide-react";
import type { EventWithStatus, Place } from "../types";
import { useUserStore } from "../store/userStore";
import EventCard from "./EventCard";
import PlaceCard from "./PlaceCard";
import ErrorBanner from "./ErrorBanner";

type Props = {
  events: EventWithStatus[];
  places: Place[];
  onEventView?: (event: EventWithStatus) => void;
  onEventInterest?: (event: EventWithStatus) => void;
  onPlaceView?: (place: Place) => void;
  onPlaceInterest?: (place: Place) => void;
};

type RecommendationType = 'favorites' | 'ai-suggested' | 'popular';

export default function Favorites({ 
  events, 
  places, 
  onEventView, 
  onEventInterest, 
  onPlaceView, 
  onPlaceInterest 
}: Props) {
  const { user, interests } = useUserStore();
  const [activeType, setActiveType] = useState<RecommendationType>('favorites');
  const loading = false;
  const error = null;

  // Get user's interested events (from user_interests table)
  const favoriteEvents = events.filter(event => 
    interests.some(interest => interest.event_id === event.id && interest.active)
  );
  
  // Get user's favorite places (from localStorage temporarily)
  const getPlaceFavorites = (): number[] => {
    const stored = localStorage.getItem('place-favorites');
    return stored ? JSON.parse(stored) : [];
  };
  
  const placeFavorites = getPlaceFavorites();
  const favoritePlaces = places.filter(place => 
    placeFavorites.includes(place.id)
  );

  // AI-suggested content (based on user's favorites categories/preferences)
  const getAISuggestions = () => {
    if (favoriteEvents.length === 0 && favoritePlaces.length === 0) {
      // If no favorites, suggest popular items
      return {
        suggestedEvents: events.slice(0, 3),
        suggestedPlaces: places.slice(0, 3)
      };
    }

    // Get categories from user's favorites
    const favoriteCategories = new Set(
      [...favoriteEvents.map(e => e.category), ...favoritePlaces.map(p => p.category)]
    );

    // Suggest similar items based on categories
    const suggestedEvents = events
      .filter(event => 
        favoriteCategories.has(event.category) && 
        !favoriteEvents.some(fav => fav.id === event.id)
      )
      .slice(0, 4);

    const suggestedPlaces = places
      .filter(place => 
        favoriteCategories.has(place.category) && 
        !favoritePlaces.some(fav => fav.id === place.id)
      )
      .slice(0, 4);

    return { suggestedEvents, suggestedPlaces };
  };

  // Popular content (highest rated)
  const getPopularContent = () => {
    const popularEvents = events
      .filter(event => event.reviews && event.reviews.length > 0)
      .sort((a, b) => {
        const avgRatingA = a.reviews!.reduce((sum, r) => sum + r.rating, 0) / a.reviews!.length;
        const avgRatingB = b.reviews!.reduce((sum, r) => sum + r.rating, 0) / b.reviews!.length;
        return avgRatingB - avgRatingA;
      })
      .slice(0, 4);

    const popularPlaces = places
      .filter(place => place.reviews && place.reviews.length > 0)
      .sort((a, b) => {
        const avgRatingA = a.reviews!.reduce((sum: number, r) => sum + r.rating, 0) / a.reviews!.length;
        const avgRatingB = b.reviews!.reduce((sum: number, r) => sum + r.rating, 0) / b.reviews!.length;
        return avgRatingB - avgRatingA;
      })
      .slice(0, 4);

    return { popularEvents, popularPlaces };
  };

  const { suggestedEvents, suggestedPlaces } = getAISuggestions();
  const { popularEvents, popularPlaces } = getPopularContent();

  if (!user) {
    return (
      <div className="text-center py-12">
        <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          Inicia sesión para ver tus favoritos
        </h2>
        <p className="text-gray-500">
          Guarda lugares y eventos que te interesen para verlos aquí
        </p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeType) {
      case 'favorites':
        if (favoriteEvents.length === 0 && favoritePlaces.length === 0) {
          return (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Aún no tienes favoritos
              </h3>
              <p className="text-gray-500">
                Explora lugares y eventos, y marca los que te gusten como favoritos
              </p>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            {favoriteEvents.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Eventos Favoritos ({favoriteEvents.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {favoriteEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onView={onEventView}
                      onInterest={onEventInterest}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {favoritePlaces.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  Lugares Favoritos ({favoritePlaces.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {favoritePlaces.map(place => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onView={onPlaceView}
                      onInterest={onPlaceInterest}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        );

      case 'ai-suggested':
        return (
          <div className="space-y-6">
            <div className="text-center py-4">
              <Sparkles className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <p className="text-sm text-gray-600">
                Basado en tus intereses y favoritos
              </p>
            </div>
            
            {suggestedEvents.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4">
                  Eventos recomendados para ti
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onView={onEventView}
                      onInterest={onEventInterest}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {suggestedPlaces.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4">
                  Lugares que podrían gustarte
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedPlaces.map(place => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onView={onPlaceView}
                      onInterest={onPlaceInterest}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        );

      case 'popular':
        return (
          <div className="space-y-6">
            {popularEvents.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4">
                  Eventos Populares
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {popularEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onView={onEventView}
                      onInterest={onEventInterest}
                    />
                  ))}
                </div>
              </section>
            )}
            
            {popularPlaces.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4">
                  Lugares Mejor Valorados
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {popularPlaces.map(place => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onView={onPlaceView}
                      onInterest={onPlaceInterest}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} />}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { key: 'favorites' as const, label: 'Mis Favoritos', icon: Heart },
          { key: 'ai-suggested' as const, label: 'Recomendados para ti', icon: Sparkles },
          { key: 'popular' as const, label: 'Populares', icon: MapPin }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveType(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeType === key
                ? 'bg-gray-900 text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200/70" />
          ))}
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
}