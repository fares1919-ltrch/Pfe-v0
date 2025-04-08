import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Fix the API URL to match the backend API requirements
const API_URL = `${environment.apiUrl}/api/profile`;

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private http: HttpClient) { }

  getUserProfile(): Observable<any> {
    return this.http.get(API_URL, { withCredentials: true });
  }

  updateProfile(formData: FormData): Observable<any> {
    return this.http.put(API_URL, formData, { withCredentials: true });
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(API_URL, { withCredentials: true });
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
}
