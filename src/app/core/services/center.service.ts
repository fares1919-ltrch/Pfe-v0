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
      map(res => res.centers)
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
}
