import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppointmentUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface AppointmentCenter {
  _id: string;
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
  workingHours?: any;
}

export interface Appointment {
  _id: string;
  userId: string | AppointmentUser;
  officerId?: string;
  centerId: string | AppointmentCenter;
  appointmentDate: string; // ISO string from backend
  status: 'pending' | 'validated' | 'rejected' | 'missed' | 'completed' | 'cancelled';
  cpfGenerationStatus?: string;
  createdAt: string;
  updatedAt: string;
  center?: AppointmentCenter;
  user?: AppointmentUser;
}

export interface ApiResponse {
  appointments: Appointment[];
  total: number;
  page?: number;
  pages?: number;
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

  // ===================================================
  // CITIZEN APPOINTMENT ENDPOINTS
  // ===================================================

  // Create a new appointment
  createAppointment(centerId: string, appointmentDate: string): Observable<any> {
    return this.http.post(`${this.API_URL}/appointments`, { centerId, appointmentDate }, { withCredentials: true });
  }

  // Get user's own appointments
  getUserAppointments(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.API_URL}/appointments`, { withCredentials: true });
  }

  // Get appointment by ID
  getAppointmentById(appointmentId: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.API_URL}/appointments/${appointmentId}`, { withCredentials: true });
  }

  // Reschedule an appointment
  rescheduleAppointment(appointmentId: string, appointmentDate: string): Observable<any> {
    return this.http.put(`${this.API_URL}/appointments/${appointmentId}/reschedule`, { appointmentDate }, { withCredentials: true });
  }

  // Cancel an appointment
  cancelAppointment(appointmentId: string): Observable<any> {
    return this.http.put(`${this.API_URL}/appointments/${appointmentId}/cancel`, {}, { withCredentials: true });
  }

  // Delete an appointment
  deleteAppointment(appointmentId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/appointments/${appointmentId}`, { withCredentials: true });
  }

  // ===================================================
  // OFFICER APPOINTMENT ENDPOINTS
  // ===================================================

  // Validate an appointment (officer only)
  validateAppointment(appointmentId: string): Observable<any> {
    return this.http.put(`${this.API_URL}/officer/appointments/${appointmentId}/validate`, {}, { withCredentials: true });
  }

  // Reject an appointment (officer only)
  rejectAppointment(appointmentId: string): Observable<any> {
    return this.http.put(`${this.API_URL}/officer/appointments/${appointmentId}/reject`, {}, { withCredentials: true });
  }

  // Complete an appointment (officer only)
  completeAppointment(appointmentId: string): Observable<any> {
    return this.http.put(`${this.API_URL}/officer/appointments/${appointmentId}/complete`, {}, { withCredentials: true });
  }

  // Mark an appointment as missed (officer only)
  missAppointment(appointmentId: string): Observable<any> {
    return this.http.put(`${this.API_URL}/officer/appointments/${appointmentId}/miss`, {}, { withCredentials: true });
  }

  // Get today's appointments (officer only)
  getTodayAppointments(centerId?: string): Observable<any> {
    let params = new HttpParams();
    if (centerId) {
      params = params.set('centerId', centerId);
    }
    return this.http.get<any>(`${this.API_URL}/officer/appointments/today`, { params, withCredentials: true });
  }

  // Get upcoming appointments (officer only)
  getUpcomingAppointments(centerId?: string): Observable<any> {
    let params = new HttpParams();
    if (centerId) {
      params = params.set('centerId', centerId);
    }
    return this.http.get<any>(`${this.API_URL}/officer/appointments/upcoming`, { params, withCredentials: true });
  }

  // Get today's validated appointments (officer only)
  getTodayValidatedAppointments(centerId?: string): Observable<any> {
    let params = new HttpParams();
    if (centerId) {
      params = params.set('centerId', centerId);
    }
    params = params.set('status', 'validated');
    return this.http.get<any>(`${this.API_URL}/officer/appointments/today`, { params, withCredentials: true });
  }

  // Get all appointments with filtering (officer only)
  getAllAppointmentsOfficer(
    status?: string,
    userId?: string,
    centerId?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10
  ): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) params = params.set('status', status);
    if (userId) params = params.set('userId', userId);
    if (centerId) params = params.set('centerId', centerId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<ApiResponse>(`${this.API_URL}/officer/appointments`, { params, withCredentials: true });
  }

  // Get all validated appointments (officer only)
  getValidatedAppointments(
    centerId?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10
  ): Observable<ApiResponse> {
    return this.getAllAppointmentsOfficer('validated', undefined, centerId, startDate, endDate, page, limit);
  }

  // Get center's daily appointments (officer only)
  getCenterDailyAppointments(centerId: string, date?: string): Observable<any> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<any>(`${this.API_URL}/officer/appointments/center/${centerId}/daily`, { params, withCredentials: true });
  }
}
