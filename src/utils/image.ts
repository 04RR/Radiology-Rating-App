import type { Report } from '../types';

export function getImageUrl(imagePath: string): string {
  // Check if the path is a URL
  try {
    new URL(imagePath);
    return imagePath;
  } catch {
    // If not a URL, assume it's a local path
    // First try to load from the public directory
    try {
      return new URL(`/images/${imagePath}`, window.location.origin).href;
    } catch {
      console.error('Invalid image path:', imagePath);
      return ''; // Return empty string if path is invalid
    }
  }
}

export function validateImagePath(imagePath: string): boolean {
  // Check if it's a valid URL
  try {
    new URL(imagePath);
    return true;
  } catch {
    // If not a URL, check if it's a valid file path
    return /^[\w\-./\\]+\.(jpg|jpeg|png|gif|webp)$/i.test(imagePath);
  }
}