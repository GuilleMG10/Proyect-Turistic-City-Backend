import { useMemo } from "react";
import type { Place, EventWithStatus } from "../types";

type Filters = {
  categories: string[];
  priceRange: [number, number];
  ageRange: [number, number];
  minRating: number;
  zones: string[];
};

type TabType = 'explorar' | 'eventos' | 'para-ti' | 'calendario';

export function useFiltering(
  places: Place[],
  events: EventWithStatus[],
  searchQuery: string,
  selectedCategory: string,
  activeTab: TabType,
  filters: Filters
) {
  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      // Search filter
      const matchesSearch = !searchQuery ||
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter (both chip and modal)
      const categoryMatches = selectedCategory === 'Todos' || place.category === selectedCategory;
      const modalCategoryMatches = filters.categories.length === 0 || filters.categories.includes(place.category);

      // Rating filter - calculate average rating from reviews
      let ratingMatches = true;
      if (filters.minRating > 0 && place.reviews && place.reviews.length > 0) {
        const avgRating = place.reviews.reduce((sum, r) => sum + r.rating, 0) / place.reviews.length;
        ratingMatches = avgRating >= filters.minRating;
      } else if (filters.minRating > 0 && (!place.reviews || place.reviews.length === 0)) {
        ratingMatches = false; // Exclude places without reviews when rating filter is active
      }

      return matchesSearch && categoryMatches && modalCategoryMatches && ratingMatches;
    });
  }, [places, searchQuery, selectedCategory, filters.categories, filters.minRating]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      const matchesSearch = !searchQuery ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter (both chip and modal)
      const categoryMatches = selectedCategory === 'Todos' || event.category === selectedCategory;
      const modalCategoryMatches = filters.categories.length === 0 || filters.categories.includes(event.category);

      // Price filter
      const priceMatches = event.price >= filters.priceRange[0] && event.price <= filters.priceRange[1];

      // Rating filter - calculate average rating from reviews
      let ratingMatches = true;
      if (filters.minRating > 0 && event.reviews && event.reviews.length > 0) {
        const avgRating = event.reviews.reduce((sum, r) => sum + r.rating, 0) / event.reviews.length;
        ratingMatches = avgRating >= filters.minRating;
      } else if (filters.minRating > 0 && (!event.reviews || event.reviews.length === 0)) {
        ratingMatches = false; // Exclude events without reviews when rating filter is active
      }

      return matchesSearch && categoryMatches && modalCategoryMatches && priceMatches && ratingMatches;
    });
  }, [events, searchQuery, selectedCategory, filters.categories, filters.priceRange, filters.minRating]);

  // Dynamic categories based on current tab
  const availableCategories = useMemo(() => {
    const allCategories = new Set<string>();

    if (activeTab === 'explorar' || activeTab === 'para-ti') {
      // Get categories from places
      places.forEach(place => {
        if (place.category) allCategories.add(place.category);
      });
    } else if (activeTab === 'eventos' || activeTab === 'calendario') {
      // Get categories from events
      events.forEach(event => {
        if (event.category) allCategories.add(event.category);
      });
    }

    return ["Todos", ...Array.from(allCategories).sort()];
  }, [places, events, activeTab]);

  return {
    filteredPlaces,
    filteredEvents,
    availableCategories
  };
}