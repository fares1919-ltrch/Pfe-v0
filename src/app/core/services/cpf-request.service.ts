import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PopulatedUser {
  _id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface CpfRequest {
  _id: string;
  userId: string | PopulatedUser;
  identityNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    lat: number;
    lon: number;
  };
  cost: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  officerDecision: {
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    decidedAt?: Date;
    decidedBy?: string | PopulatedUser;
  };
  appointmentDate?: Date;
  centerId: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface ApiResponse {
  requests: CpfRequest[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

@Injectable({
  providedIn: 'root'
})
export class CpfRequestService {
  private API_URL = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) { }

  // Create new CPF request
  createCpfRequest(requestData: Partial<CpfRequest>): Observable<CpfRequest> {
    return this.http.post<CpfRequest>(`${this.API_URL}/cpf-requests`, requestData, { withCredentials: true });
  }

  // Get all CPF requests with pagination
  getAllCpfRequests(page: number = 1, limit: number = 10): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse>(`${this.API_URL}/cpf-requests`, { params, withCredentials: true });
  }

  // Get user's own CPF requests
  getUserCpfRequests(): Observable<CpfRequest[]> {
    return this.http.get<CpfRequest[]>(`${this.API_URL}/cpf-requests/user`, { withCredentials: true });
  }

  // Get pending CPF requests (officer only)
  getPendingRequests(page: number = 1, limit: number = 10): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse>(`${this.API_URL}/cpf-requests/pending`, { params, withCredentials: true });
  }

  // Get a specific CPF request by ID
  getCpfRequestById(requestId: string): Observable<CpfRequest> {
    return this.http.get<CpfRequest>(`${this.API_URL}/cpf-requests/${requestId}`, { withCredentials: true });
  }

  // Update request status (officer only)
  updateRequestStatus(requestId: string, status: string, comment?: string): Observable<any> {
    return this.http.put(`${this.API_URL}/cpf-requests/${requestId}/status`, {
      status,
      comments: comment
    }, { withCredentials: true });
  }

  // Delete CPF request (user can only delete their own pending requests)
  deleteCpfRequest(requestId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/cpf-requests/${requestId}/delete`, { withCredentials: true });
  }

  // Submit CPF request with location data
  submitCpfRequest(requestData: any): Observable<CpfRequest> {
    console.log('Service: Submitting CPF request with data:', requestData);
    return this.http.post<CpfRequest>(`${this.API_URL}/cpf-requests`, requestData, { withCredentials: true });
  }
}
