import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import io from 'socket.io-client';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../environments/environment';

export interface SocketNotification {
  _id: string;
  type: string;
  title?: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId?: string;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: any = null;
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();

  constructor(private tokenStorageService: TokenStorageService) {
    // Auto-connect when component initializes if user is authenticated
    this.checkAndConnect();
  }

  private checkAndConnect(): void {
    const token = this.tokenStorageService.getToken();
    if (token) {
      this.connect();
    }
  }

  connect(): void {
    if (!this.tokenStorageService.getToken()) {
      // Do not connect if no token
      return;
    }
    if (this.socket?.connected) {
      return;
    }

    const token = this.tokenStorageService.getToken();
    if (!token) {
      console.error('Cannot connect to socket: No authentication token');
      return;
    }

    // Using io function from socket.io-client
    try {
      this.socket = io(environment.apiUrl || 'http://localhost:8080', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000 // Increase timeout to 20 seconds
      });

      this.socket.on('connect', () => {
        console.log('Connected to socket server');
        this.isConnectedSubject.next(true);

        // Immediately subscribe to role-specific channels when connected
        const user = this.tokenStorageService.getUser();
        if (user && user.roles) {
          // Subscribe to role-specific channels
          if (user.roles.includes('ROLE_OFFICER')) {
            this.emit('subscribe:role', 'officer');
          }
          if (user.roles.includes('ROLE_CITIZEN')) {
            this.emit('subscribe:role', 'citizen');
          }
          if (user.roles.includes('ROLE_ADMIN')) {
            this.emit('subscribe:role', 'admin');
          }
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        this.isConnectedSubject.next(false);

        // Try to reconnect automatically after a delay
        setTimeout(() => {
          if (!this.socket?.connected) {
            console.log('Attempting to reconnect...');
            this.reconnect();
          }
        }, 3000);
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error);
        this.isConnectedSubject.next(false);
      });

      // Add ping-pong to keep connection alive
      this.startKeepAlive();
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }

  // Add method to keep connection alive
  private startKeepAlive(): void {
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Send ping every 30 seconds
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnectedSubject.next(false);
    }
  }

  // Generic event listener
  on<T>(eventName: string): Observable<T> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.on(eventName, (data: T) => {
        observer.next(data);
      });

      // Cleanup function
      return () => {
        if (this.socket) {
          this.socket.off(eventName);
        }
      };
    });
  }

  // Generic event emitter
  emit(eventName: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(eventName, data);
    } else {
      console.error('Cannot emit event: Socket not connected');
    }
  }

  // Listen for notification events
  onNotificationReceived(): Observable<SocketNotification> {
    return new Observable<SocketNotification>(observer => {
      if (!this.socket) {
        observer.error('Socket connection not established');
        return;
      }

      this.socket.on('notification', (data: SocketNotification) => {
        observer.next(data);
      });

      return () => {
        if (this.socket) {
          this.socket.off('notification');
        }
      };
    });
  }

  // Listen for appointment updates
  onAppointmentUpdate(): Observable<SocketNotification> {
    return new Observable<SocketNotification>(observer => {
      if (!this.socket) {
        observer.error('Socket connection not established');
        return;
      }

      this.socket.on('appointment_update', (data: SocketNotification) => {
        observer.next(data);
      });

      return () => {
        if (this.socket) {
          this.socket.off('appointment_update');
        }
      };
    });
  }

  // Listen for role-specific notifications
  onRoleNotification(): Observable<SocketNotification> {
    return new Observable<SocketNotification>(observer => {
      if (!this.socket) {
        observer.error('Socket connection not established');
        return;
      }

      this.socket.on('role_notification', (data: SocketNotification) => {
        observer.next(data);
      });

      return () => {
        if (this.socket) {
          this.socket.off('role_notification');
        }
      };
    });
  }

  // Subscribe to appointment status updates
  subscribeToAppointmentStatus(appointmentId: string): void {
    this.emit('appointment-status:subscribe', appointmentId);
  }

  // Listen for status updates
  onStatusUpdate(): Observable<any> {
    return this.on('status:update');
  }

  // Listen for live data updates (for dashboards)
  onDataUpdate(): Observable<any> {
    return this.on('data:update');
  }

  // Check if socket is connected
  isConnected(): Observable<boolean> {
    return this.isConnected$;
  }

  // Enhanced reconnect method
  reconnect(): void {
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // Generic method to listen for any event from the socket server
  onEvent(event: string): Observable<any> {
    return new Observable<any>(observer => {
      if (!this.socket) {
        observer.error('Socket connection not established');
        return;
      }

      this.socket.on(event, (data: any) => {
        observer.next(data);
      });

      return () => {
        if (this.socket) {
          this.socket.off(event);
        }
      };
    });
  }
}
