import { Component, AfterViewInit, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CenterService } from '../../../../../core/services/center.service';

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
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.scss']
})
export class MapsComponent implements AfterViewInit {
  @Output() locationSelected = new EventEmitter<LocationInfo>();

  public map: any;
  private userMarker: any;
  private userCircle: any;
  public currentLoc: { lat: number; lon: number } = { lat: 0, lon: 0 };
  private lastLoc: { lat: number; lon: number } = { lat: 0, lon: 0 };
  private address: string = '';
  private centersArray: { id: string; name: string; coords: [number, number]; address: string }[] = [];
  public isLoading: boolean = true;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private centerService: CenterService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet');
      await this.initMap(L);
      this.isLoading = false;
    }
  }

  private async initMap(L: any): Promise<void> {
    this.map = L.map('map').setView([36.8065, 10.1815], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ' OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      this.updateUserLocation(L, lat, lng);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();
        this.address = data.display_name || 'Address not found';
        this.updateLocationInfo(L, lat, lng);
      } catch (error) {
        console.error('Error getting address:', error);
      }
    });

    // Get centers from API
    this.centerService.getAllActiveCenters().subscribe({
      next: (response) => {
        console.log("Centers retrieved:", response.centers);

        // Transform centers data to the format we need
        this.centersArray = response.centers
          .map(center => ({
            id: center.id,
            name: center.name,
            coords: [center.lat, center.lon] as [number, number],
            address: center.address
          }));

        if (this.centersArray.length === 0) {
          console.warn('No centers available');
          return;
        }

        // Add markers for each center
        this.centersArray.forEach(center => {
          const centerIcon = L.divIcon({
            className: 'center-marker',
            html: '<div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });

          L.marker(center.coords, { icon: centerIcon })
            .addTo(this.map)
            .bindPopup(`
              <div class="text-sm">
                <b class="text-blue-600">${center.name}</b><br>
                <span class="text-gray-600">${center.address}</span>
              </div>
            `);
        });

        // If we have user's location, update it
        if (this.currentLoc.lat !== 0 && this.currentLoc.lon !== 0) {
          this.updateUserLocation(L, this.currentLoc.lat, this.currentLoc.lon);
        }
      },
      error: (err) => {
        console.error("Error fetching centers:", err);
      }
    });

    // User geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLoc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          this.updateUserLocation(L, this.currentLoc.lat, this.currentLoc.lon);
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true }
      );
    }
  }

  private updateUserLocation(L: any, lat: number, lon: number): void {
    const position = [lat, lon];

    if (this.userCircle) {
      this.userCircle.setLatLng(position);
    } else {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: '<div class="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg pulse"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      this.userCircle = L.marker(position, { icon: userIcon })
        .addTo(this.map)
        .bindPopup('Your location');
    }

    this.lastLoc = { lat, lon };
    this.updateLocationInfo(L, lat, lon);
  }

  private async updateLocationInfo(L: any, userLat: number, userLng: number): Promise<void> {
    if (!this.centersArray.length) {
      console.warn('No centers available');
      return;
    }

    const userPos = L.latLng(userLat, userLng);

    // Find closest center
    let closest = this.centersArray[0];
    let minDistance = userPos.distanceTo(L.latLng(closest.coords));

    this.centersArray.forEach(center => {
      const dist = userPos.distanceTo(L.latLng(center.coords));
      if (dist < minDistance) {
        closest = center;
        minDistance = dist;
      }
    });

    try {
      // Get address through reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json&addressdetails=1`
      );
      const data = await response.json();
      const address: Address = {
        street: data.address.road || '',
        city: data.address.city || data.address.town || data.address.village || '',
        state: data.address.state || '',
        postalCode: data.address.postcode || '',
        country: data.address.country || '',
        lat: userLat,
        lon: userLng
      };
      this.locationSelected.emit({
        address,
        center: {
          id: closest.id,
          name: closest.name,
          address: closest.address,
          distance: +(minDistance / 1000).toFixed(2),
          coords: closest.coords
        },
        userCoords: {
          lat: userLat,
          lon: userLng
        }
      });

      // Draw line to nearest center
      if (this.map) {
        // Remove existing lines
        this.map.eachLayer((layer: any) => {
          if (layer instanceof L.Polyline) {
            this.map.removeLayer(layer);
          }
        });

        // Draw new line to nearest center
        const line = L.polyline([
          [userLat, userLng],
          closest.coords
        ], {
          color: '#3B82F6',
          weight: 2,
          dashArray: '5, 10',
          opacity: 0.6
        }).addTo(this.map);

        // Fit bounds to show both points
        this.map.fitBounds(line.getBounds(), { padding: [50, 50] });
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
    }
  }
}
