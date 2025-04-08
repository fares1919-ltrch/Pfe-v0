import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment';

const API_URL = `${environment.apiUrl}/api/test/`;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) { }

  getPublicContent(): Observable<any> {
    // Only make HTTP request in browser
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(API_URL + 'all', { responseType: 'text', withCredentials: true });
    }
    // Return empty observable for server-side
    return new Observable();
  }

  getUserBoard(): Observable<any> {
    // Only make HTTP request in browser
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(API_URL + 'user', { responseType: 'text', withCredentials: true });
    }
    // Return empty observable for server-side
    return new Observable();
  }

  getManagerBoard(): Observable<any> {
    // Only make HTTP request in browser
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(API_URL + 'manager', { responseType: 'text', withCredentials: true });
    }
    // Return empty observable for server-side
    return new Observable();
  }

  getOfficerBoard(): Observable<any> {
    // Only make HTTP request in browser
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(API_URL + 'officer', { responseType: 'text', withCredentials: true });
    }
    // Return empty observable for server-side
    return new Observable();
  }

  // Profile-related methods
  getUserProfile(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/profile`, { withCredentials: true });
  }

  updateUserProfile(formData: FormData): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/profile`, formData, { withCredentials: true });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/password/change`, {
      currentPassword,
      newPassword
    }, { withCredentials: true });
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/profile`, { withCredentials: true });
  }
}
