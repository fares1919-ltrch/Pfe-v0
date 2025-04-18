import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Center {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    lat: number;
    lon: number;
  };
  region: string;
  capacity: {
    daily: number;
    hourly: number;
  };
  workingHours: {
    monday: { start: string; end: string };
    tuesday: { start: string; end: string };
    wednesday: { start: string; end: string };
    thursday: { start: string; end: string };
    friday: { start: string; end: string };
    saturday: { start: string; end: string };
    sunday: { start: string; end: string };
  };
  status: string;
  contact: {
    phone: string;
    email: string;
  };
  services: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CentersResponse {
  centers: Center[];
}

export interface Appointment {
  id: string;
  userId: string;
  date: string;
  status: string;
  user: {
    username: string;
    firstName: string;
    lastName: string;
  };
}

export type ScheduleResponse = Appointment[];

export interface StatsResponse {
  centerId: string;
  period: { start: string; end: string };
  stats: {
    totalAppointments: number;
    completed: number;
    rescheduled: number;
    noShow: number;
    averageProcessingTime: number;
    biometricCollectionSuccess: number;
  };
}

// Add a new interface for raw API data that might have inconsistencies
interface RawCenterData {
  id?: string;
  _id?: string;
  name?: string;
  address?: any; // Could be string or object
  region?: string;
  capacity?: {
    daily?: number;
    hourly?: number;
  };
  workingHours?: {
    monday?: { start?: string; end?: string };
    tuesday?: { start?: string; end?: string };
    wednesday?: { start?: string; end?: string };
    thursday?: { start?: string; end?: string };
    friday?: { start?: string; end?: string };
    saturday?: { start?: string; end?: string };
    sunday?: { start?: string; end?: string };
  };
  status?: string;
  contact?: {
    phone?: string;
    email?: string;
  };
  services?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow any additional properties
}

@Injectable({
  providedIn: 'root'
})
export class CenterService {
  private apiUrl = `${environment.apiUrl}/api/centers`;

  constructor(private http: HttpClient) { }

  getAllActiveCenters(): Observable<CentersResponse> {
    return this.http.get<CentersResponse>(this.apiUrl, {
      withCredentials: true
    });
  }

  /**
   * Convenience method returning only the array of centers
   */
  getCenters(): Observable<Center[]> {
    return this.getAllActiveCenters().pipe(
      map(res => {
        // Check if we received a valid response with centers array
        if (!res || !res.centers || !Array.isArray(res.centers)) {
          console.error('Invalid centers response:', res);
          return [];
        }

        // Map and normalize the center data to ensure it matches our interface
        return res.centers.map((center: RawCenterData) => {
          // Log the raw center data from API
          console.log('Raw center data from API:', center);

          // Log the exact address structure to diagnose coordinate issues
          if (center.address && typeof center.address === 'object') {
            console.log(`Address structure for ${center.name || center._id}:`,
              JSON.stringify(center.address, null, 2));
          }

          // Check if the center has _id instead of id (MongoDB format)
          const id = (center.id || center._id || 'unknown') as string;

          // Ensure address is properly formatted as an object with coordinates
          let address: Center['address'];

          if (typeof center.address === 'string') {
            // If address is a string, create an object with placeholder coordinates
            console.warn(`Center ${center.name} has address as string, normalizing:`, center.address);
            const addressParts = center.address.split(',').map((part: string) => part.trim());
            address = {
              street: addressParts[0] || 'Unknown Street',
              city: addressParts[1] || 'Unknown City',
              state: addressParts[2] || 'Unknown State',
              postalCode: 'Unknown',
              lat: 0,
              lon: 0
            };
          } else if (center.address && typeof center.address === 'object') {
            // If address is already an object, ensure it has all required properties
            // Extract coordinates carefully checking for all possible formats
            let lat = 0;
            let lon = 0;

            // Direct properties
            if (typeof center.address.lat === 'number') lat = center.address.lat;
            else if (typeof center.address.lat === 'string') lat = parseFloat(center.address.lat);
            else if (typeof center.address.latitude === 'number') lat = center.address.latitude;
            else if (typeof center.address.latitude === 'string') lat = parseFloat(center.address.latitude);

            if (typeof center.address.lon === 'number') lon = center.address.lon;
            else if (typeof center.address.lon === 'string') lon = parseFloat(center.address.lon);
            else if (typeof center.address.lng === 'number') lon = center.address.lng;
            else if (typeof center.address.lng === 'string') lon = parseFloat(center.address.lng);
            else if (typeof center.address.longitude === 'number') lon = center.address.longitude;
            else if (typeof center.address.longitude === 'string') lon = parseFloat(center.address.longitude);

            // Check for nested coordinate objects
            if (center.address.coordinates && Array.isArray(center.address.coordinates) && center.address.coordinates.length >= 2) {
              // GeoJSON format [longitude, latitude]
              lon = parseFloat(center.address.coordinates[0]);
              lat = parseFloat(center.address.coordinates[1]);
            } else if (center.address.location && typeof center.address.location === 'object') {
              // MongoDB geospatial format
              if (typeof center.address.location.lat === 'number') lat = center.address.location.lat;
              else if (typeof center.address.location.lat === 'string') lat = parseFloat(center.address.location.lat);
              else if (typeof center.address.location.latitude === 'number') lat = center.address.location.latitude;
              else if (typeof center.address.location.latitude === 'string') lat = parseFloat(center.address.location.latitude);

              if (typeof center.address.location.lon === 'number') lon = center.address.location.lon;
              else if (typeof center.address.location.lon === 'string') lon = parseFloat(center.address.location.lon);
              else if (typeof center.address.location.lng === 'number') lon = center.address.location.lng;
              else if (typeof center.address.location.lng === 'string') lon = parseFloat(center.address.location.lng);
              else if (typeof center.address.location.longitude === 'number') lon = center.address.location.longitude;
              else if (typeof center.address.location.longitude === 'string') lon = parseFloat(center.address.location.longitude);

              // GeoJSON coordinates in MongoDB
              if (center.address.location.coordinates && Array.isArray(center.address.location.coordinates) && center.address.location.coordinates.length >= 2) {
                lon = parseFloat(center.address.location.coordinates[0]);
                lat = parseFloat(center.address.location.coordinates[1]);
              }
            }

            console.log(`Extracted coordinates for ${center.name}: [${lat}, ${lon}]`);

            address = {
              street: center.address.street || 'Unknown Street',
              city: center.address.city || 'Unknown City',
              state: center.address.state || 'Unknown State',
              postalCode: center.address.postalCode || 'Unknown',
              lat: lat,
              lon: lon
            };
          } else {
            // Default placeholder address
            address = {
              street: 'Unknown Street',
              city: 'Unknown City',
              state: 'Unknown State',
              postalCode: 'Unknown',
              lat: 0,
              lon: 0
            };
          }

          // If coordinates are missing, log warning and add fallback coordinates based on region
          if (address.lat === 0 && address.lon === 0) {
            console.warn(`Center ${center.name} has missing coordinates. Adding fallback based on region.`);

            // Set fallback coordinates based on center name or region
            const fallbackCoordinates = this.getFallbackCoordinates(center.name, center.region);
            address.lat = fallbackCoordinates.lat;
            address.lon = fallbackCoordinates.lon;

            console.log(`Added fallback coordinates for ${center.name}: [${address.lat}, ${address.lon}]`);
          }

          // Normalize the center object to match our interface
          const normalizedCenter: Center = {
            id: id,
            name: center.name || 'Unknown Center',
            address: address,
            region: center.region || 'Unknown Region',
            capacity: {
              daily: center.capacity?.daily || 0,
              hourly: center.capacity?.hourly || 0
            },
            workingHours: {
              monday: {
                start: center.workingHours?.monday?.start || '',
                end: center.workingHours?.monday?.end || ''
              },
              tuesday: {
                start: center.workingHours?.tuesday?.start || '',
                end: center.workingHours?.tuesday?.end || ''
              },
              wednesday: {
                start: center.workingHours?.wednesday?.start || '',
                end: center.workingHours?.wednesday?.end || ''
              },
              thursday: {
                start: center.workingHours?.thursday?.start || '',
                end: center.workingHours?.thursday?.end || ''
              },
              friday: {
                start: center.workingHours?.friday?.start || '',
                end: center.workingHours?.friday?.end || ''
              },
              saturday: {
                start: center.workingHours?.saturday?.start || '',
                end: center.workingHours?.saturday?.end || ''
              },
              sunday: {
                start: center.workingHours?.sunday?.start || '',
                end: center.workingHours?.sunday?.end || ''
              }
            },
            status: center.status || 'unknown',
            contact: {
              phone: center.contact?.phone || '',
              email: center.contact?.email || ''
            },
            services: Array.isArray(center.services) ? center.services : [],
            createdAt: center.createdAt || '',
            updatedAt: center.updatedAt || ''
          };

          // Log the normalized center
          console.log('Normalized center:', normalizedCenter);

          return normalizedCenter;
        });
      })
    );
  }

  /** Get center by ID */
  getCenterById(id: string): Observable<Center> {
    return this.http.get<Center>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  /** Create new center */
  createCenter(center: Center): Observable<Center> {
    return this.http.post<Center>(this.apiUrl, center, { withCredentials: true });
  }

  /** Update existing center */
  updateCenter(id: string, center: Center): Observable<Center> {
    return this.http.put<Center>(`${this.apiUrl}/${id}`, center, { withCredentials: true });
  }

  /** Get center's daily schedule */
  getCenterSchedule(id: string, date?: string): Observable<ScheduleResponse> {
    let url = `${this.apiUrl}/${id}/schedule`;
    if (date) { url += `?date=${date}`; }
    return this.http.get<ScheduleResponse>(url, { withCredentials: true });
  }

  /** Get center statistics */
  getCenterStats(id: string, startDate: string, endDate: string): Observable<StatsResponse> {
    const params = `?startDate=${startDate}&endDate=${endDate}`;
    return this.http.get<StatsResponse>(`${this.apiUrl}/${id}/stats${params}`, { withCredentials: true });
  }

  /**
   * Get temporary fallback coordinates for centers with missing location data
   * This is a workaround until proper coordinates are stored in the database
   */
  private getFallbackCoordinates(centerName?: string, region?: string): { lat: number; lon: number } {
    // Default Tunisia central coordinates
    let lat = 36.8065;
    let lon = 10.1815;

    // Ensure we have strings to work with
    const name = centerName || '';
    const reg = region || '';

    // Try to assign reasonable coordinates based on region or center name
    if (name.includes('Sfax') || reg.includes('Sfax')) {
      // Sfax coordinates
      lat = 34.7398;
      lon = 10.7600;
    } else if (name.includes('Tunis') || reg.includes('Tunis')) {
      // Tunis coordinates
      lat = 36.8065;
      lon = 10.1815;
    } else if (name.includes('Sousse') || reg.includes('Sousse')) {
      // Sousse coordinates
      lat = 35.8245;
      lon = 10.6346;
    } else if (name.includes('Mahdia') || reg.includes('East Coast')) {
      // Mahdia coordinates
      lat = 35.5049;
      lon = 11.0622;
    } else if (name.includes('Bouzid') || reg.includes('Central')) {
      // Sidi Bouzid coordinates
      lat = 35.0382;
      lon = 9.4857;
    } else {
      // Add small random offset for different centers to spread them on map
      const randomOffset = () => (Math.random() - 0.5) * 0.5; // +/- 0.25 degrees (about 28km)
      lat += randomOffset();
      lon += randomOffset();
    }

    return { lat, lon };
  }
}
