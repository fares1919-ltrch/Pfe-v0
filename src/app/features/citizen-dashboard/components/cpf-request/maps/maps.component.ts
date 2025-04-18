import { Component, AfterViewInit, Inject, PLATFORM_ID, Output, EventEmitter, ElementRef, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Center, CenterService } from '../../../../../core/services/center.service';
import { loadLeaflet, isBrowserEnvironment } from '../../../../../shared/utils/leaflet-loader';

// Leaflet instance will be loaded dynamically
let L: any;

// Add type declarations for Leaflet
declare global {
  interface Window {
    L: any; // For Leaflet
  }
}

interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat: number;
  lon: number;
}

interface LocationInfo {
  address: Address;
  center: {
    id: string;
    name: string;
    address: string;
    distance: number;
    coords: [number, number];
  };
  userCoords: {
    lat: number;
    lon: number;
  };
}

@Component({
  selector: 'app-maps',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="map-container relative w-full h-full">
    <!-- Map Container -->
    <div #mapContainer id="map" class="w-full h-full rounded-lg"></div>

    <!-- Map Instructions Overlay -->
    <div class="absolute top-4 right-4 bg-white/90 p-3 rounded-lg shadow-md max-w-xs z-[1000]">
      <div class="text-sm text-gray-700">
        <h3 class="font-semibold mb-2">Instructions:</h3>
        <ul class="list-disc list-inside space-y-1">
          <li>We'll try to get your location automatically</li>
          <li>You can also click on the map to select a different location</li>
          <li>Blue markers show available service centers</li>
          <li>Red marker shows your selected location</li>
        </ul>
      </div>
    </div>

    <!-- Location Permission Message -->
    <div *ngIf="locationPermissionStatus === 'waiting'" class="absolute inset-0 flex items-center justify-center bg-gray-800/70 z-[1001]">
      <div class="bg-white p-5 rounded-lg shadow-xl max-w-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Location Access</h3>
        <p class="text-gray-600 mb-4">Please accept the location permission to find the nearest service center to you.</p>
        <button (click)="retryGeolocation()" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none">
          Allow Location
        </button>
      </div>
    </div>

    <!-- Location Error Message -->
    <div *ngIf="locationPermissionStatus === 'denied'" class="absolute inset-0 flex items-center justify-center bg-gray-800/70 z-[1001]">
      <div class="bg-white p-5 rounded-lg shadow-xl max-w-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Location Access Denied</h3>
        <p class="text-gray-600 mb-4">You've denied location access. You can still select your location by clicking on the map.</p>
        <p class="text-sm text-gray-500 mb-4">To enable location access, update your browser settings and then click the button below.</p>
        <button (click)="retryGeolocation()" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none">
          Try Again
        </button>
      </div>
    </div>

    <!-- No Centers Message -->
    <div *ngIf="showNoCentersMessage" class="absolute inset-0 flex items-center justify-center bg-gray-800/70 z-[1001]">
      <div class="bg-white p-5 rounded-lg shadow-xl max-w-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="text-lg font-bold text-gray-800 mb-2">No Centers Found</h3>
        <p class="text-gray-600 mb-4">We couldn't find any service centers with valid location data. Please select any location on the map to continue.</p>
        <button (click)="dismissNoCentersMessage()" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none">
          OK
        </button>
      </div>
    </div>

    <!-- Loading Indicator -->
    <div *ngIf="isLoading" class="absolute inset-0 flex items-center justify-center bg-gray-100/50">
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium text-gray-700">{{ isGettingUserLocation ? 'Getting your location...' : 'Loading map...' }}</span>
      </div>
    </div>
  </div>
  `,
  styleUrls: ['./maps.component.scss']
})
export class MapsComponent implements AfterViewInit, OnDestroy {
  @Output() locationSelected = new EventEmitter<LocationInfo>();
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private map: any = null;
  private userMarker: any = null;
  private routingControl: any = null;
  public currentLoc: { lat: number; lon: number } = { lat: 0, lon: 0 }; // Initialize with zeros
  private lastLoc: { lat: number; lon: number } = { lat: 0, lon: 0 };
  private centersMarkers: any[] = [];
  private centersInfo: Array<{
    id: string;
    name: string;
    coords: [number, number];
    address: string;
    marker: any;
  }> = [];
  private polyline: any = null;

  public isLoading: boolean = true;
  public isGettingUserLocation: boolean = false;
  public locationPermissionStatus: 'waiting' | 'granted' | 'denied' | 'unavailable' | null = null;
  public showNoCentersMessage: boolean = false;
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private centerService: CenterService,
    private ngZone: NgZone
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.isBrowser) {
      try {
        // Load Leaflet using our utility
        L = await loadLeaflet();

        if (!L) {
          throw new Error("Failed to load Leaflet");
        }

        await this.initLeafletMap();
      } catch (error) {
        console.error("Error initializing map:", error);
        this.isLoading = false;
        this.locationPermissionStatus = 'unavailable';
      }
    } else {
      // For SSR, just mark as not loading
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser && this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private async initLeafletMap(): Promise<void> {
    if (!this.isBrowser) return;

    if (!this.mapContainer) {
      console.error('Map container not found');
      return;
    }

    // Default center coordinates to Tunisia if geolocation is not available
    const defaultLat = 36.8065;
    const defaultLon = 10.1815;

    // Create a Leaflet map
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [defaultLat, defaultLon],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add click event
    this.map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
      // Extract and explicitly convert coordinates to numbers
      const lat = Number(e.latlng.lat);
      const lng = Number(e.latlng.lng);

      // Validate coordinates before using them
      if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        console.error('Invalid coordinates from map click:', { lat, lng });
        return;
      }

      this.updateUserLocation(lat, lng);
      // If this was manually selected, clear any permission status overlays
      this.locationPermissionStatus = null;
    });

    // Load centers
    this.loadCenters();

    // Automatically try to get user location
    this.getUserLocationAutomatically();
  }

  private getUserLocationAutomatically(): void {
    if (!this.isBrowser) return;

    if (!navigator.geolocation) {
      console.warn("Geolocation API not available in this browser");
      this.locationPermissionStatus = 'unavailable';
      return;
    }

    this.isGettingUserLocation = true;
    this.locationPermissionStatus = 'waiting';

    try {
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          this.getGeolocation();
        } else if (result.state === 'prompt') {
          // Will show the browser's prompt automatically when getGeolocation is called
          this.getGeolocation();
        } else if (result.state === 'denied') {
          console.warn("Geolocation permission denied");
          this.locationPermissionStatus = 'denied';
          this.isGettingUserLocation = false;
        }

        // Listen for changes to permission
        result.addEventListener('change', () => {
          if (result.state === 'granted') {
            this.getGeolocation();
          } else if (result.state === 'denied') {
            this.locationPermissionStatus = 'denied';
            this.isGettingUserLocation = false;
          }
        });
      }).catch(error => {
        console.error("Error checking geolocation permission:", error);
        // Fall back to the regular geolocation API
        this.getGeolocation();
      });
    } catch (error) {
      console.error("Error with permissions API:", error);
      // Fall back to the regular geolocation API
      this.getGeolocation();
    }
  }

  public retryGeolocation(): void {
    if (!this.isBrowser) return;

    this.locationPermissionStatus = 'waiting';
    this.isGettingUserLocation = true;
    this.getGeolocation();
  }

  private getGeolocation(): void {
    if (!this.isBrowser) return;

    this.isGettingUserLocation = true;
    this.isLoading = true;

    // Add a loading indicator to the map
    if (this.map) {
      // We could add a temporary loading message to the map if needed
      console.log('Requesting user location...');
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success callback
        // Validate the coordinates
        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);

        if (isNaN(latitude) || isNaN(longitude) ||
            !isFinite(latitude) || !isFinite(longitude)) {
          console.error('Invalid coordinates from geolocation:',
                      { lat: position.coords.latitude, lng: position.coords.longitude });

          this.isGettingUserLocation = false;
          this.isLoading = false;
          this.locationPermissionStatus = 'unavailable';
          return;
        }

        const coordinates = {
          lat: latitude,
          lon: longitude
        };

        this.currentLoc = coordinates;
        console.log("Successfully obtained user coordinates:", coordinates);

        // Update UI state
        this.locationPermissionStatus = 'granted';
        this.isGettingUserLocation = false;
        this.isLoading = false;

        // Set a small timeout to ensure map is fully initialized
        setTimeout(() => {
          if (!this.map) {
            console.error('Map not initialized in timeout');
            return;
          }

          // Center the map on user's location and add marker
          this.updateUserLocation(coordinates.lat, coordinates.lon);

          // Show success notification
          if (this.map) {
            this.showSuccessMessage();
          }
        }, 500);
      },
      (error) => {
        // Error callback
        console.error("Geolocation error:", error);

        // Update UI state
        this.isGettingUserLocation = false;
        this.isLoading = false;

        switch(error.code) {
          case error.PERMISSION_DENIED:
            this.locationPermissionStatus = 'denied';
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationPermissionStatus = 'unavailable';
            console.error("Location information is unavailable");
            break;
          case error.TIMEOUT:
            this.locationPermissionStatus = 'unavailable';
            console.error("Location request timed out");
            break;
          default:
            this.locationPermissionStatus = 'unavailable';
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  private loadCenters(): void {
    this.centerService.getCenters().subscribe({
      next: (response: Center[]) => {
        if (!this.isBrowser) return;

        console.log("Centers retrieved:", response.length > 0 ? response : "No centers");

        if (!response || !Array.isArray(response) || response.length === 0) {
          console.error("No valid centers received");
          this.isLoading = false;
          this.showNoCentersMessage = true;
          return;
        }

        // Log details for debugging
        response.forEach(center => {
          console.log(`Center: ${center.name}, Coordinates: [${center.address?.lat}, ${center.address?.lon}]`);
        });

        // Check if we have any valid centers with coordinates
        const validCenters = response.filter(center =>
          center.address &&
          center.address.lat !== undefined &&
          center.address.lon !== undefined &&
          !isNaN(Number(center.address.lat)) &&
          !isNaN(Number(center.address.lon)) &&
          !(Number(center.address.lat) === 0 && Number(center.address.lon) === 0)
        );

        console.log(`Found ${validCenters.length} centers with valid coordinates out of ${response.length} total`);

        if (validCenters.length === 0) {
          console.warn("No centers with valid coordinates available");
          this.isLoading = false;
          this.showNoCentersMessage = true;
          return;
        }

        // Add markers for each center with valid coordinates
        validCenters.forEach(center => this.addCenterMarker(center));

        this.isLoading = !this.isGettingUserLocation; // Keep loading true if still getting location

        // If we have user's location, update it
        if (this.currentLoc.lat !== 0 && this.currentLoc.lon !== 0) {
          this.updateUserLocation(this.currentLoc.lat, this.currentLoc.lon);
        }
      },
      error: (err) => {
        console.error("Error fetching centers:", err);
        this.isLoading = false;
        this.showNoCentersMessage = true;
      }
    });
  }

  private addCenterMarker(center: Center): void {
    if (!this.isBrowser || !this.map) return;

    // Get coordinates and explicitly convert to numbers
    const lat = Number(center.address.lat);
    const lon = Number(center.address.lon);

    // Additional validation to ensure center has valid coordinates
    if (!center.address || isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon) || (lat === 0 && lon === 0)) {
      console.warn(`Center ${center.name} has invalid coordinates, skipping`);
      return;
    }

    // Log coordinate information for debugging
    console.log(`Adding marker for ${center.name} at [${lat}, ${lon}]`);

    // Create marker for center
    const position = [lat, lon];

    const centerIcon = L.divIcon({
      className: 'center-marker',
      html: '<div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    // Add marker
    try {
      const marker = L.marker(position, { icon: centerIcon })
        .addTo(this.map)
        .bindPopup(`
          <div class="text-sm">
            <b class="text-blue-600">${center.name}</b><br>
            <span class="text-gray-600">${center.address.street || ''}, ${center.address.city || ''}, ${center.address.state || ''}</span>
          </div>
        `);

      this.centersMarkers.push(marker);
      this.centersInfo.push({
        id: center.id,
        name: center.name,
        coords: [lat, lon],
        address: `${center.address.street || ''}, ${center.address.city || ''}, ${center.address.state || ''}`,
        marker
      });
    } catch (error) {
      console.error(`Error adding marker for center ${center.name}:`, error);
    }
  }

  private updateUserLocation(lat: number, lng: number): void {
    if (!this.isBrowser || !this.map) return;

    // Convert to numbers and validate
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (isNaN(latitude) || isNaN(longitude) ||
        !isFinite(latitude) || !isFinite(longitude)) {
      console.error('Invalid coordinates:', { lat, lng });
      return;
    }

    console.log('Updating user location to:', { latitude, longitude });
    const position = [latitude, longitude];

    // Center the map on the user's location with animation
    try {
      // Create a proper LatLng object
      console.log('Setting map view to position:', [latitude, longitude]);

      // First check if we can create a valid LatLng object
      if (!isNaN(latitude) && !isNaN(longitude) && isFinite(latitude) && isFinite(longitude)) {
        // Set view directly instead of using flyTo which can sometimes cause issues
        this.map.setView([latitude, longitude], 14, {
          animate: true,
          duration: 1.5
        });
      } else {
        console.error('Invalid coordinates for map center:', { latitude, longitude });
      }
    } catch (error) {
      console.error('Error centering map:', error);
    }

    // Update or create user marker
    if (this.userMarker) {
      try {
        this.userMarker.setLatLng(position);
      } catch (error) {
        console.error('Error updating marker position:', error);

        // If updating fails, remove the old marker and create a new one
        this.map.removeLayer(this.userMarker);
        this.userMarker = null;
      }
    }

    if (!this.userMarker) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: '<div class="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow-lg pulse"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      this.userMarker = L.marker(position, {
        icon: userIcon,
        draggable: true
      })
        .addTo(this.map)
        .bindPopup('<div class="text-center"><strong>Your location</strong><br><span class="text-xs text-gray-500">Drag me to adjust</span></div>')
        .openPopup();

      // Update location when marker is dragged
      this.userMarker.on('dragend', (event: any) => {
        const marker = event.target;
        const newPosition = marker.getLatLng();
        console.log('Marker dragged to:', newPosition);
        this.findNearestCenter(newPosition.lat, newPosition.lng);
      });
    }

    this.lastLoc = { lat: latitude, lon: longitude };

    // Find nearest center with the updated location
    this.findNearestCenter(latitude, longitude);
  }

  private async findNearestCenter(userLat: number, userLng: number): Promise<void> {
    if (!this.isBrowser || !this.map) return;

    if (this.centersInfo.length === 0) {
      console.warn('No centers available for finding nearest');
      this.showNoCentersMessage = true;

      // Emit location info even when no centers are available
      this.emitLocationInfoWithoutCenter(userLat, userLng);
      return;
    }

    // Validate coordinates
    const latitude = Number(userLat);
    const longitude = Number(userLng);

    if (isNaN(latitude) || isNaN(longitude) ||
        !isFinite(latitude) || !isFinite(longitude)) {
      console.error('Invalid coordinates for finding nearest center:', { userLat, userLng });
      return;
    }

    // Try to get address through reverse geocoding
    let address: Address;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
      );
      const data = await response.json();
      address = {
        street: data.address?.road || '',
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        postalCode: data.address?.postcode || '',
        country: data.address?.country || '',
        lat: latitude,
        lon: longitude
      };
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      // Fallback address
      address = {
        street: 'Unknown Street',
        city: 'Unknown City',
        state: 'Unknown State',
        postalCode: 'Unknown',
        country: 'Unknown',
        lat: latitude,
        lon: longitude
      };
    }

    // Find nearest center if any valid centers exist
    const userPos = L.latLng(latitude, longitude);
    let closest: typeof this.centersInfo[0] | null = null;
    let minDistance = Infinity;

    // Find the first valid center to compare with
    for (const center of this.centersInfo) {
      try {
        if (center.coords[0] === 0 && center.coords[1] === 0) {
          continue; // Skip centers with zero coordinates
        }
        const centerPos = L.latLng(center.coords[0], center.coords[1]);
        const dist = userPos.distanceTo(centerPos);
        if (dist < minDistance) {
          closest = center;
          minDistance = dist;
        }
      } catch (error) {
        console.error(`Error calculating distance for center ${center.name}:`, error);
        continue;
      }
    }

    // If no valid centers found, emit location without center
    if (closest === null) {
      console.warn('No centers with valid coordinates found');
      this.showNoCentersMessage = true;
      this.emitLocationInfoWithoutCenter(latitude, longitude, address);
      return;
    }

    // We found a valid center, hide the no centers message if it was showing
    this.showNoCentersMessage = false;

    // Remove any existing polylines
    if (this.polyline) {
      this.map.removeLayer(this.polyline);
      this.polyline = null;
    }

    // Add the new polyline
    try {
      this.polyline = L.polyline([
        [latitude, longitude],
        closest.coords
      ], {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.6,
        dashArray: '5, 10'
      }).addTo(this.map);

      // Ensure both points are visible
      this.map.fitBounds(this.polyline.getBounds(), { padding: [50, 50] });
    } catch (error) {
      console.error('Error creating or displaying polyline:', error);
    }

    // Emit the location info
    this.ngZone.run(() => {
      this.locationSelected.emit({
        address,
        center: {
          id: closest.id,
          name: closest.name,
          address: closest.address,
          distance: +(minDistance / 1000).toFixed(2), // Convert to km and round to 2 decimals
          coords: closest.coords
        },
        userCoords: {
          lat: latitude,
          lon: longitude
        }
      });
    });
  }

  private emitLocationInfoWithoutCenter(lat: number, lon: number, address?: Address): void {
    // Create a fallback address if not provided
    if (!address) {
      address = {
        street: 'Unknown Street',
        city: 'Unknown City',
        state: 'Unknown State',
        postalCode: 'Unknown',
        country: 'Unknown',
        lat: lat,
        lon: lon
      };
    }

    // Emit location info without a center
    this.ngZone.run(() => {
      this.locationSelected.emit({
        address,
        center: {
          id: 'no-center',
          name: 'No Available Center',
          address: 'No centers with valid coordinates available',
          distance: 0,
          coords: [0, 0]
        },
        userCoords: {
          lat: lat,
          lon: lon
        }
      });
    });
  }

  private showSuccessMessage(): void {
    if (!this.isBrowser || !this.map) return;

    // Create a DOM element for the message
    const messageElement = document.createElement('div');
    messageElement.className = 'location-success-message leaflet-control';
    messageElement.innerHTML = `
      <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 rounded shadow-md text-sm mb-2">
        <div class="flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Location found successfully!
        </div>
      </div>
    `;

    // Create a custom control container at the bottom left
    const controlContainer = document.createElement('div');
    controlContainer.className = 'leaflet-bottom leaflet-left';
    controlContainer.appendChild(messageElement);

    // Add to map container
    this.map.getContainer().appendChild(controlContainer);

    // Remove the message after a few seconds
    setTimeout(() => {
      if (controlContainer.parentNode) {
        controlContainer.parentNode.removeChild(controlContainer);
      }
    }, 5000);
  }

  dismissNoCentersMessage(): void {
    this.showNoCentersMessage = false;
  }
}
