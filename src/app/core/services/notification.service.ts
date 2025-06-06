import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SocketService } from './socket.service';
import { TokenStorageService } from './token-storage.service';

export interface Notification {
  _id: string;
  userId: string;
  type: 'appointment' | 'request_status' | 'document' | 'system';
  title: string;
  message: string;
  read: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  currentPage: number;
  totalPages: number;
  totalNotifications: number;
}

export interface UnreadCountResponse {
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:8080'}/api/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private socketService: SocketService,
    private tokenStorage: TokenStorageService
  ) {
    // Only subscribe to notifications if there is a token
    if (this.tokenStorage.getToken()) {
      this.subscribeToAllNotifications();
      this.updateUnreadCount();
    }
  }

  private subscribeToAllNotifications(): void {
    // Connect to socket if not already connected
    this.socketService.connect();

    // Regular notifications
    this.socketService.onNotificationReceived().subscribe({
      next: (notification) => {
        console.log('Notification service received notification:', notification);
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error in notification subscription:', error);
      }
    });

    // Appointment updates
    this.socketService.onAppointmentUpdate().subscribe({
      next: (data) => {
        console.log('Notification service received appointment update:', data);
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error in appointment update subscription:', error);
      }
    });

    // Role notifications
    this.socketService.onRoleNotification().subscribe({
      next: (data) => {
        console.log('Notification service received role notification:', data);
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error in role notification subscription:', error);
      }
    });
  }

  // Fetch user's notifications with pagination
  getNotifications(page: number = 1, limit: number = 10, read?: boolean): Observable<NotificationResponse> {
    if (!this.tokenStorage.getToken()) {
      return of({ notifications: [], currentPage: 1, totalPages: 1, totalNotifications: 0 });
    }
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (read !== undefined) {
      url += `&read=${read}`;
    }
    return this.http.get<NotificationResponse>(url);
  }

  // Get unread notifications count
  getUnreadCount(): Observable<UnreadCountResponse> {
    if (!this.tokenStorage.getToken()) {
      return of({ count: 0 });
    }
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread`)
      .pipe(
        tap(response => {
          this.unreadCountSubject.next(response.count);
        })
      );
  }

  // Mark a notification as read
  markAsRead(notificationId: string): Observable<{message: string}> {
    if (!this.tokenStorage.getToken()) {
      return of({ message: '' });
    }
    return this.http.put<{message: string}>(`${this.apiUrl}/${notificationId}/read`, {})
      .pipe(
        tap(() => {
          this.updateUnreadCount();
        })
      );
  }

  // Mark all notifications as read
  markAllAsRead(): Observable<{message: string}> {
    if (!this.tokenStorage.getToken()) {
      return of({ message: '' });
    }
    return this.http.put<{message: string}>(`${this.apiUrl}/read-all`, {})
      .pipe(
        tap(() => {
          this.unreadCountSubject.next(0);
        })
      );
  }

  // Delete a notification
  deleteNotification(notificationId: string): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/${notificationId}`)
      .pipe(
        tap(() => {
          this.updateUnreadCount();
        })
      );
  }

  // Update the unread count
  private updateUnreadCount(): void {
    this.getUnreadCount().subscribe({
      error: () => {
        console.error('Failed to fetch unread notification count');
      }
    });
  }

  // Show browser notification
  showBrowserNotification(title: string, message: string): void {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }

    if (Notification.permission === 'granted') {
      this.createNotification(title, message);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createNotification(title, message);
        }
      });
    }
  }

  private createNotification(title: string, message: string): void {
    try {
      const notification = new Notification(title, {
        body: message,
        icon: 'assets/images/icons/logo.png'
      });

      // Close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Add click handler to notification
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Request notification permission
  requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return Promise.resolve('denied' as NotificationPermission);
    }

    if (Notification.permission === 'granted') {
      return Promise.resolve(Notification.permission);
    }

    return Notification.requestPermission();
  }

  // Existing snackbar methods
  showSuccess(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showError(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showWarning(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showInfo(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
