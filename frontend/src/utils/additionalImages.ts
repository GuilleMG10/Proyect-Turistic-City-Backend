// Utility for managing additional images for places (stored in localStorage as workaround)

const ADDITIONAL_IMAGES_KEY = 'place-additional-images';

interface PlaceImages {
  [placeId: number]: string[]; // Array of base64 image strings
}

// Get all additional images (internal use)
function getAdditionalImages(): PlaceImages {
  try {
    const stored = localStorage.getItem(ADDITIONAL_IMAGES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save additional images
function saveAdditionalImages(images: PlaceImages): void {
  try {
    localStorage.setItem(ADDITIONAL_IMAGES_KEY, JSON.stringify(images));
  } catch (error) {
    console.error('Failed to save additional images:', error);
    throw new Error('No se pudo guardar las imágenes. El almacenamiento puede estar lleno.');
  }
}

// Get images for a specific place
export function getPlaceAdditionalImages(placeId: number): string[] {
  const allImages = getAdditionalImages();
  return allImages[placeId] || [];
}

// Add image to a place
export function addPlaceImage(placeId: number, imageBase64: string): void {
  const allImages = getAdditionalImages();
  
  if (!allImages[placeId]) {
    allImages[placeId] = [];
  }
  
  allImages[placeId].push(imageBase64);
  saveAdditionalImages(allImages);
}

// Remove image from a place
export function removePlaceImage(placeId: number, imageIndex: number): void {
  const allImages = getAdditionalImages();
  
  if (allImages[placeId]) {
    allImages[placeId].splice(imageIndex, 1);
    
    // Remove array if empty
    if (allImages[placeId].length === 0) {
      delete allImages[placeId];
    }
    
    saveAdditionalImages(allImages);
  }
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

// Validate image file
export function validateImageFile(file: File): string | null {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'El archivo debe ser una imagen';
  }
  
  // Check if it's JPG/JPEG
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
    return 'Solo se permiten imágenes JPG/JPEG';
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return 'La imagen no puede superar los 5MB';
  }
  
  return null;
}
