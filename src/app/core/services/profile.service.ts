import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Fix the API URL to match the backend API requirements
const API_URL = `${environment.apiUrl}/api/profile`;

export interface LocationUpdate {
  address: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private http: HttpClient) { }

  getUserProfile(): Observable<any> {
    return this.http.get(API_URL, { withCredentials: true });
  }

  updateProfile(formData: FormData): Observable<any> {
    return this.http.put(`${API_URL}`, formData, {
      withCredentials: true
    });
  }

  // New method to update user's address from map selection
  updateUserLocation(locationData: LocationUpdate): Observable<any> {
    return this.http.patch(`${API_URL}/location`, locationData, {
      withCredentials: true
    });
  }

  // New method to validate profile completeness for CPF request
  validateProfileForCpf(): Observable<{
    isComplete: boolean;
    missingFields: string[];
    locationNeeded: boolean;
    message: string;
  }> {
    return this.http.get<any>(`${API_URL}/validate-cpf`, {
      withCredentials: true
    });
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(API_URL, { withCredentials: true });
  }

  checkIdentityNumberUnique(identityNumber: string): Observable<boolean> {
    return this.http.get<boolean>(`${API_URL}/check-identity/${identityNumber}`, { withCredentials: true });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/password/change`, {
      currentPassword,
      newPassword
    }, { withCredentials: true });
  }

  linkOAuthAccount(provider: string, providerId: string): Observable<any> {
    return this.http.post(`${API_URL}/link-oauth`, { provider, providerId }, { withCredentials: true });
  }

  getActiveSessions(): Observable<any> {
    return this.http.get(`${API_URL}/sessions`, { withCredentials: true });
  }

  revokeSession(sessionToken: string): Observable<any> {
    return this.http.delete(`${API_URL}/sessions/${sessionToken}`, { withCredentials: true });
  }

  // New method to sync profile with CPF request data
  syncProfileWithCpf(): Observable<any> {
    return this.http.post(`${API_URL}/sync-cpf`, {}, {
      withCredentials: true
    });
  }
}
