// Utility to handle image loading with fallbacks
export const getImageSrc = (originalSrc: string | null, fallbackType: 'place' | 'event' = 'place'): string => {
  // If no image provided, return appropriate placeholder
  if (!originalSrc) {
    return getPlaceholderImage(fallbackType);
  }

  // Check if it's an external URL that might cause CORS issues
  const corsProblematicDomains = [
    'upload.wikimedia.org',
    'lostiempos.com',
    'reduno.com.bo',
    'eldeber.com.bo',
    'wikipedia.org',
    'wikimedia.org'
  ];

  const isProblematicUrl = corsProblematicDomains.some(domain => 
    originalSrc.includes(domain)
  );

  // If it's a problematic URL, use backend proxy
  if (isProblematicUrl) {
    console.warn(`CORS-problematic image detected: ${originalSrc}, using backend proxy`);
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
    return `${apiBaseUrl}/proxy-image?url=${encodeURIComponent(originalSrc)}`;
  }

  return originalSrc;
};

export const getPlaceholderImage = (type: 'place' | 'event' = 'place'): string => {
  const placeImages = [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=600&fit=crop", // Mountains
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop", // Mountain landscape
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop", // City view
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop", // Architecture
    "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&h=600&fit=crop", // Park
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop"  // Nature
  ];

  const eventImages = [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop", // Event crowd
    "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop", // Cultural event
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop", // Festival
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop", // Live music
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=600&fit=crop", // Art exhibition
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"  // Sports event
  ];

  const images = type === 'place' ? placeImages : eventImages;
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
};

export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement>, 
  fallbackType: 'place' | 'event' = 'place'
) => {
  const target = e.target as HTMLImageElement;
  const originalSrc = target.src;
  
  // Avoid infinite loops by checking if we're already using a placeholder
  if (!originalSrc.includes('images.unsplash.com')) {
    console.warn(`Image failed to load: ${originalSrc}, using placeholder`);
    target.src = getPlaceholderImage(fallbackType);
    
    // Add a class to indicate this is a fallback image
    target.classList.add('fallback-image');
  }
};