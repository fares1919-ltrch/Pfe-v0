import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';


export interface Appointment {
  _id: string;
  userId: string;
  officerId: string;
  cpfRequestId: string;
  appointmentDate: Date;
  status: string; // "scheduled", "completed", "cancelled", "missed"
  notes: string;
  location: string; // Reference to Center ID
  createdAt: Date;
  updatedAt: Date;

  // Populated fields (not always present)
  user?: any;
  officer?: any;
  cpfRequest?: any;
  locationDetails?: any;
}

export interface ApiResponse {
  appointments: Appointment[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableSlotsResponse {
  date: string;
  center: string;
  slots: TimeSlot[];
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private API_URL = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) { }

  // Get user's own appointments
  getUserAppointments(): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.API_URL}/appointments/user`, { withCredentials: true });
  }

  // Delete user's own appointment
  deleteAppointment(appointmentId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/appointments/${appointmentId}`, { withCredentials: true });
  }

  // Get appointment by CPF request ID
  getAppointmentByRequestId(requestId: string): Observable<Appointment | null> {
    return this.http.get<Appointment | null>(`${this.API_URL}/appointments/by-request/${requestId}`, { withCredentials: true })
      .pipe(
        catchError((err: any) => {
          if (err.status === 404) {
            return of(null);
          }
          throw err;
        })
      );
  }

  // Create new appointment
  createAppointment(appointmentData: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.API_URL}/appointments`, appointmentData, { withCredentials: true });
  }

  // Update appointment status (officer only)
  updateAppointmentStatus(id: string, status: string, notes?: string): Observable<any> {
    return this.http.put(`${this.API_URL}/appointments/${id}/status`, { status, notes }, { withCredentials: true });
  }

  // Get officer's appointments
  getOfficerAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.API_URL}/appointments/officer`, { withCredentials: true });
  }

  // Get available appointment slots
  getAvailableSlots(date: string, centerId: string): Observable<AvailableSlotsResponse> {
    const params = new HttpParams().set('date', date).set('center', centerId);
    return this.http.get<AvailableSlotsResponse>(`${this.API_URL}/appointments/slots`, { params, withCredentials: true });
  }

  // Reschedule appointment
  rescheduleAppointment(id: string, newDateTime: string, reason: string): Observable<any> {
    return this.http.put(`${this.API_URL}/appointments/${id}/reschedule`, { newDateTime, reason }, { withCredentials: true });
  }

  // Get center's daily appointments (officer only)
  getCenterDailyAppointments(centerId: string, date: string): Observable<Appointment[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Appointment[]>(`${this.API_URL}/appointments/center/${centerId}/daily`, { params, withCredentials: true });
  }
}
