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
    cpfGenerationSuccess: string;
    generatedCpfs: number;
    fraudulentCpfs: number;
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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllActiveCenters(): Observable<CentersResponse> {
    return this.http.get<CentersResponse>(`${this.apiUrl}/api/centers`);
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

          // Check if the center has _id instead of id (MongoDB format)
          const id = (center.id || center._id || 'unknown') as string;

          // Direct access to address coordinates - no fallbacks
          let lat = 0;
          let lon = 0;

          // Safely extract coordinates from the address object
          if (center.address && typeof center.address === 'object') {
            if (typeof center.address.lat === 'number') lat = center.address.lat;
            else if (typeof center.address.lat === 'string') lat = parseFloat(center.address.lat);

            if (typeof center.address.lon === 'number') lon = center.address.lon;
            else if (typeof center.address.lon === 'string') lon = parseFloat(center.address.lon);

            console.log(`Extracted coordinates for ${center.name}: [${lat}, ${lon}]`);
          } else {
            console.warn(`Center ${center.name || id} has no valid address object with coordinates`);
          }

          // Normalize the center object to match our interface
          const normalizedCenter: Center = {
            id: id,
            name: center.name || 'Unknown Center',
            address: {
              street: center.address?.street || '',
              city: center.address?.city || '',
              state: center.address?.state || '',
              postalCode: center.address?.postalCode || '',
              lat: lat,
              lon: lon
            },
            region: center.region || '',
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

          return normalizedCenter;
        });
      })
    );
  }

  /** Get center by ID */
  getCenterById(id: string): Observable<Center> {
    return this.http.get<Center>(`${this.apiUrl}/api/centers/${id}`);
  }

  /** Create new center */
  createCenter(center: Partial<Center>): Observable<Center> {
    // Only send fields accepted by backend
    const payload: any = {
      name: center.name,
      address: center.address,
      region: center.region,
      capacity: center.capacity,
      workingHours: center.workingHours,
      services: center.services,
      contact: center.contact
    };
    return this.http.post<Center>(`${this.apiUrl}/api/centers`, payload);
  }

  /** Update existing center */
  updateCenter(id: string, center: Partial<Center>): Observable<Center> {
    // Only send fields accepted by backend
    const payload: any = {
      name: center.name,
      address: center.address,
      region: center.region,
      capacity: center.capacity,
      workingHours: center.workingHours,
      services: center.services,
      contact: center.contact
    };
    return this.http.put<Center>(`${this.apiUrl}/api/centers/${id}`, payload);
  }

  /** Get center statistics */
  getCenterStats(id: string, startDate: string, endDate: string): Observable<StatsResponse> {
    const params = `?startDate=${startDate}&endDate=${endDate}`;
    return this.http.get<StatsResponse>(`${this.apiUrl}/api/officer/centers/${id}/statistics${params}`);
  }

  // Get centers near a location
  getNearestCenters(lat: number, lon: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/centers/nearest?lat=${lat}&lon=${lon}`);
  }

  // Get available dates for a specific center
  getAvailableDates(centerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/centers/${centerId}/available-dates`);
  }

  // Get available time slots for a specific date at a center
  getAvailableTimeSlots(centerId: string, date: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/centers/${centerId}/available-slots?date=${date}`);
  }
}
