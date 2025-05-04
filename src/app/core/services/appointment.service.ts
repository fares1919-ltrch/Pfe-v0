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

  
  

  getTodayAppointements(): Observable<any> {
    console.log("get today appointments servicccccccccccccccccce")
    return this.http.get<any>(`${this.API_URL}/appointments/today`, { withCredentials: true });
  }

  getUpcomingAppointements(): Observable<any> {
    console.log("get upcoming appointments servicccccccccccccccccce")
    return this.http.get<any>(`${this.API_URL}/appointments/upcoming`, { withCredentials: true });
  }

  cancelAppointment(appointmentId: string): Observable<any> {
    console.log("cancel appointment servicccccccccccccccccce" , appointmentId)
    return this.http.put(`${this.API_URL}/appointments/cancel/${appointmentId}`, {}, { withCredentials: true });
  }

  markAppointmentAsMissed(appointmentId: string): Observable<any> {
    console.log("missed appointment servicccccccccccccccccce" , appointmentId)

    return this.http.put(`${this.API_URL}/appointments/missed/${appointmentId}`, {}, { withCredentials: true });
  }
}
