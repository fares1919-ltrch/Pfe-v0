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
  username?: string;
  identityNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    lat?: number;
    lon?: number;
  };
  cost: string;
  status: string;
  officerDecision: {
    // add fields as per your backend
  };
  centerId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  __v: number;
  appointmentDate?: Date | string;
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
export class RequestService {
  private API_URL = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  //Create new CPF request
  createCpfRequest(requestData: Partial<CpfRequest>): Observable<CpfRequest> {
    return this.http.post<CpfRequest>(`${this.API_URL}/cpf-requests`, requestData);
  }

  //Get all CPF requests
  getAllCpfRequests(): Observable<CpfRequest[]> {
    return this.http.get<CpfRequest[]>(`${this.API_URL}/cpf-requests`);
  }

  //Get user own CPF requests
  getUserCpfRequests(userId: string): Observable<CpfRequest[]> {
    return this.http.get<CpfRequest[]>(`${this.API_URL}/cpf-requests/user/${userId}`);
  }


  //Delete user own CPF request
  deleteCpfRequest(requestId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/cpf-requests/${requestId}`);
  }



  // Get pending CPF requests with pagination
  getPendingRequests(page: number = 1, limit: number = 10): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse>(`${this.API_URL}/cpf-requests/pending`, { params });
  }
  // Get all status for CPF requests with pagination
  getAllStatusRequests(page: number = 1, limit: number = 10): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('status', 'pending,approved,rejected,completed');

    return this.http.get<ApiResponse>(
      `${this.API_URL}/cpf-requests`,
      { params }
    );
  }

  // Get a specific CPF request by ID
  getCpfRequestById(requestId: string): Observable<CpfRequest> {
    return this.http.get<CpfRequest>(`${this.API_URL}/cpf-requests/${requestId}`);
  }

  // Update request status
  updateRequestStatus(requestId: string, status: string): Observable<any> {
    return this.http.put(`${this.API_URL}/cpf-requests/${requestId}/status`, { status });
  }
}