import { useMemo } from "react";
import type { EventWithStatus, Place } from "../types";

export function useRecommendations(
  events: EventWithStatus[],
  places: Place[],
  favoriteEvents: EventWithStatus[],
  favoritePlaces: Place[]
) {
  const aiSuggestions = useMemo(() => {
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
  }, [events, places, favoriteEvents, favoritePlaces]);

  const popularContent = useMemo(() => {
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
  }, [events, places]);

  return {
    aiSuggestions,
    popularContent
  };
}