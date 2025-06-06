/**
 * ProfileService
 * Handles all profile-related API calls for Sprint 1.
 * Maps directly to backend /api/profile endpoints.
 */
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

  /**
   * Get the current user's profile.
   * Backend: GET /api/profile
   */
  getUserProfile(): Observable<any> {
    return this.http.get(API_URL, { withCredentials: true });
  }

  /**
   * Update the current user's profile.
   * Backend: PUT /api/profile
   * @param formData - FormData with updated profile fields
   */
  updateProfile(formData: FormData): Observable<any> {
    return this.http.put(`${API_URL}`, formData, {
      withCredentials: true
    });
  }

  /**
   * Update user's address/location from map selection.
   * Backend: PATCH /api/profile/location
   */
  updateUserLocation(locationData: LocationUpdate): Observable<any> {
    return this.http.patch(`${API_URL}/location`, locationData, {
      withCredentials: true
    });
  }

  /**
   * Validate profile completeness for CPF request.
   * Backend: GET /api/profile/validate-cpf
   */
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

  /**
   * Delete the current user's account.
   * Backend: DELETE /api/profile
   */
  deleteAccount(): Observable<any> {
    return this.http.delete(API_URL, { withCredentials: true });
  }

  /**
   * Check if identity number is unique for the current user.
   * Backend: GET /api/profile/check-identity/:identityNumber
   */
  checkIdentityNumberUnique(identityNumber: string): Observable<boolean> {
    return this.http.get<boolean>(`${API_URL}/check-identity/${identityNumber}`, { withCredentials: true });
  }

  /**
   * Change the current user's password.
   * Backend: POST /api/password/change
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/password/change`, {
      currentPassword,
      newPassword
    }, { withCredentials: true });
  }

  /**
   * Link an OAuth account to the current user's profile.
   * Backend: POST /api/profile/link-oauth
   */
  linkOAuthAccount(provider: string, providerId: string): Observable<any> {
    return this.http.post(`${API_URL}/link-oauth`, { provider, providerId }, { withCredentials: true });
  }

  /**
   * Get the current user's active sessions.
   * Backend: GET /api/profile/sessions
   */
  getActiveSessions(): Observable<any> {
    return this.http.get(`${API_URL}/sessions`, { withCredentials: true });
  }

  /**
   * Revoke a specific session for the current user.
   * Backend: DELETE /api/profile/sessions/:sessionToken
   */
  revokeSession(sessionToken: string): Observable<any> {
    return this.http.delete(`${API_URL}/sessions/${sessionToken}`, { withCredentials: true });
  }

  /**
   * Sync profile with CPF request data (future use).
   * Backend: POST /api/profile/sync-cpf
   */
  syncProfileWithCpf(): Observable<any> {
    return this.http.post(`${API_URL}/sync-cpf`, {}, {
      withCredentials: true
    });
  }
}
