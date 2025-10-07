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

      // Note: Places don't have price/rating in our current DB structure, but we can extend this later

      return matchesSearch && categoryMatches && modalCategoryMatches;
    });
  }, [places, searchQuery, selectedCategory, filters.categories]);

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

      return matchesSearch && categoryMatches && modalCategoryMatches && priceMatches;
    });
  }, [events, searchQuery, selectedCategory, filters.categories, filters.priceRange]);

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