import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

// API endpoints constants
const API_BASE_URL = environment.apiUrl;
const TEST_API = `${API_BASE_URL}/api/test/`;
const USERS_API = `${API_BASE_URL}/api/users/`;
const PASSWORD_API = `${API_BASE_URL}/api/password/`;

export interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) { }

  getPublicContent(): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(TEST_API + 'all', { responseType: 'text' });
    }
    return new Observable();
  }

  getUserBoard(): Observable<any> {
    // Only make HTTP request in browser
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(TEST_API + 'user', { responseType: 'text', withCredentials: true });
    }
    // Return empty observable for server-side
    return new Observable();
  }

  getManagerBoard(): Observable<any> {
    // Only make HTTP request in browser
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(TEST_API + 'manager', { responseType: 'text', withCredentials: true });
    }
    // Return empty observable for server-side
    return new Observable();
  }

  getOfficerBoard(): Observable<any> {
    // Only make HTTP request in browser
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(TEST_API + 'officer', { responseType: 'text', withCredentials: true });
    }
    // Return empty observable for server-side
    return new Observable();
  }

  // Profile-related methods
  getUserProfile(): Observable<any> {
    return this.http.get(`${API_BASE_URL}/api/profile`, { withCredentials: true });
  }

  updateUserProfile(formData: FormData): Observable<any> {
    return this.http.put(`${API_BASE_URL}/api/profile`, formData, { withCredentials: true });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(PASSWORD_API + 'change', {
      currentPassword,
      newPassword
    }, { withCredentials: true });
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${API_BASE_URL}/api/profile`, { withCredentials: true });
  }

  checkIdentityNumber(identityNumber: string): Observable<boolean> {
    return this.http.get<{ isAvailable: boolean }>(USERS_API + `check-identity/${identityNumber}`)
      .pipe(map(response => response.isAvailable));
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(USERS_API + userId, { withCredentials: true });
  }
}
