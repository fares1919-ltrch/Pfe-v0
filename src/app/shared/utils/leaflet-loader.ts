/**
 * Utility for loading Leaflet in an Angular SSR-compatible way
 */

let leafletInstance: any = null;

/**
 * Dynamically loads Leaflet library and its CSS
 * Only works in browser environment
 */
export async function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (leafletInstance) {
    return leafletInstance;
  }

  try {
    // Import Leaflet
    const leafletModule = await import('leaflet');
    leafletInstance = leafletModule.default || leafletModule;

    // Add Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      linkElement.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      linkElement.crossOrigin = '';
      document.head.appendChild(linkElement);
    }

    return leafletInstance;
  } catch (error) {
    console.error('Failed to load Leaflet:', error);
    return null;
  }
}

/**
 * Checks if we're in a browser environment
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined';
}
