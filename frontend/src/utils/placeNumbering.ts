import type { Place } from '../types';

const PLACE_NUMBERS_KEY = 'place-display-numbers';

interface PlaceNumberMap {
  [placeId: number]: number;
}

// Get place number mapping from localStorage
export function getPlaceNumbers(): PlaceNumberMap {
  try {
    const stored = localStorage.getItem(PLACE_NUMBERS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save place number mapping to localStorage
function savePlaceNumbers(numberMap: PlaceNumberMap): void {
  try {
    localStorage.setItem(PLACE_NUMBERS_KEY, JSON.stringify(numberMap));
  } catch (error) {
    console.error('Failed to save place numbers:', error);
  }
}

// Assign numbers to places that don't have them
export function assignPlaceNumbers(places: Place[]): Place[] {
  const numberMap = getPlaceNumbers();
  let maxNumber = Math.max(0, ...Object.values(numberMap));
  let hasChanges = false;
  
  // Sort places by ID to ensure consistent numbering
  const sortedPlaces = [...places].sort((a, b) => a.id - b.id);
  
  // Assign numbers to places that don't have them
  for (const place of sortedPlaces) {
    if (!numberMap[place.id]) {
      maxNumber++;
      numberMap[place.id] = maxNumber;
      hasChanges = true;
    }
  }
  
  // Save if there were changes
  if (hasChanges) {
    savePlaceNumbers(numberMap);
  }
  
  // Return places with display_number property
  return places.map(place => ({
    ...place,
    display_number: numberMap[place.id] || 0,
  }));
}


