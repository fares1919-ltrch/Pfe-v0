import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

const API_URL = 'http://localhost:8080/api/test/';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) { }

  getPublicContent(): Observable<any> {
    // Only make HTTP request in browser
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(API_URL + 'all', { responseType: 'text' });
    }
    // Return empty observable for server-side
    return new Observable();
  }

  getUserBoard(): Observable<any> {
    // Only make HTTP request in browser
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(API_URL + 'user', { responseType: 'text' });
    }
    // Return empty observable for server-side
    return new Observable();
  }

  getManagerBoard(): Observable<any> {
    // Only make HTTP request in browser
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(API_URL + 'manager', { responseType: 'text' });
    }
    // Return empty observable for server-side
    return new Observable();
  }

  getOfficerBoard(): Observable<any> {
    // Only make HTTP request in browser
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(API_URL + 'officer', { responseType: 'text' });
    }
    // Return empty observable for server-side
    return new Observable();
  }
}
