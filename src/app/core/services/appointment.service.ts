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
  status: string;
  notes: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface ApiResponse {
  appointments: Appointment[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private API_URL = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  // Get user's own appointments
  getUserAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.API_URL}/appointments/user`);
  }

  //Delete user own appointment
  deleteAppointment(appointmentId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/appointments/${appointmentId}`);
  }
  // Get appointment by CPF request ID
  getAppointmentByRequestId(requestId: string): Observable<Appointment | null> {
    return this.http.get<Appointment | null>(`${this.API_URL}/appointments/by-request/${requestId}`)
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
    return this.http.post<Appointment>(`${this.API_URL}/appointments`, appointmentData);
  }

  // Update appointment status (officer only)
  updateAppointmentStatus(id: string, status: string, notes?: string): Observable<any> {
    return this.http.put(`${this.API_URL}/appointments/${id}/status`, { status, notes });
  }

  // Get officer's appointments
  getOfficerAppointments(officerId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.API_URL}/appointments/officer/${officerId}`);
  }

  // Get available appointment slots
  getAvailableSlots(date: string, centerId: string): Observable<string[]> {
    const params = new HttpParams().set('date', date).set('centerId', centerId);
    return this.http.get<string[]>(`${this.API_URL}/appointments/slots`, { params });
  }

  // Reschedule appointment
  rescheduleAppointment(id: string, newDateTime: string, reason: string): Observable<any> {
    return this.http.put(`${this.API_URL}/appointments/${id}/reschedule`, { newDateTime, reason });
  }

  // Get center's daily appointments (officer only)
  getCenterDailyAppointments(centerId: string, date: string): Observable<Appointment[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Appointment[]>(`${this.API_URL}/appointments/center/${centerId}/daily`, { params });
  }
}
