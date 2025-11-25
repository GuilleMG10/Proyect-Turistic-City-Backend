// Utility to handle image loading with fallbacks using placehold.co
import type React from 'react';

/**
 * Gets initials from a name (e.g., "Dani Torrez" -> "DT")
 */
export const getInitials = (name: string): string => {
  if (!name) return 'PL';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

/**
 * Returns the image URL or a placeholder if null
 */
export const getImageSrc = (
  originalSrc: string | null, 
  name?: string,
  fallbackType: 'place' | 'event' = 'place'
): string => {
  // If no image provided, return placeholder
  if (!originalSrc) {
    return getPlaceholderImage(name, fallbackType);
  }

  // Return the direct URL (CORS already resolved in backend)
  return originalSrc;
};

/**
 * Generates a placehold.co placeholder with initials
 */
export const getPlaceholderImage = (name?: string, type: 'place' | 'event' = 'place'): string => {
  const initials = name ? getInitials(name) : (type === 'place' ? 'PL' : 'EV');
  const colors = type === 'place' 
    ? { bg: '4F46E5', text: 'FFFFFF' }  // Indigo for places
    : { bg: 'DCE546', text: 'FFFFFF' };  // Orange for events
  
  return `https://placehold.co/800x600/${colors.bg}/${colors.text}?text=${encodeURIComponent(initials)}`;
};

/**
 * Handles image loading errors by switching to placeholder
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement>, 
  name?: string,
  fallbackType: 'place' | 'event' = 'place'
) => {
  const target = e.target as HTMLImageElement;
  const originalSrc = target.src;
  
  // Avoid infinite loops by checking if we're already using a placeholder
  if (!originalSrc.includes('placehold.co')) {
    console.warn(`Image failed to load: ${originalSrc}, using placeholder`);
    target.src = getPlaceholderImage(name, fallbackType);
    target.classList.add('fallback-image');
  }
};