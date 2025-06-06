/**
 * AdminService
 * Handles all admin-related API calls for Sprint 1.
 * Maps directly to backend /api/admin/users endpoints.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// API endpoint base
const API_BASE_URL = environment.apiUrl;
const ADMIN_API = `${API_BASE_URL}/api/admin/users`;

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: 'manager' | 'officer';
  status: 'pending' | 'active' | 'blocked';
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) {}

  /**
   * List/filter managers and officers.
   * Backend: GET /api/admin/users
   * Supports filtering by role, username, email, status, and search.
   */
  getAdminUsers(
    filters: {
      role?: 'manager' | 'officer',
      username?: string,
      email?: string,
      status?: 'pending' | 'active' | 'blocked',
      search?: string,
      page?: number,
      limit?: number
    } = {}
  ): Observable<{ users: AdminUser[], total: number, page: number, pages: number }> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value as string);
      }
    });
    return this.http.get<{ users: AdminUser[], total: number, page: number, pages: number }>(ADMIN_API, { params, withCredentials: true });
  }

  /**
   * Change status (activate, block, unblock) for a manager/officer.
   * Backend: PATCH /api/admin/users/:id/status
   * @param userId - The user ID
   * @param status - 'active' or 'blocked' (cannot revert to 'pending')
   */
  updateUserStatus(userId: string, status: 'active' | 'blocked'): Observable<any> {
    return this.http.patch(`${ADMIN_API}/${userId}/status`, { status }, { withCredentials: true });
  }

  /**
   * Delete a manager/officer.
   * Backend: DELETE /api/admin/users/:id
   * @param userId - The user ID
   */
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${ADMIN_API}/${userId}`, { withCredentials: true });
  }
}
