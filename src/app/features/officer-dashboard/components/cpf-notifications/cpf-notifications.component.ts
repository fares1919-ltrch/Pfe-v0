import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocketService } from '../../../../core/services/socket.service';
import { CommonModule } from '@angular/common';

interface CPFNotification {
  requestId: string;
  citizenName: string;
  citizenEmail: string;
  identityNumber: string;
  address: any;
  status: string;
  createdAt: Date;
  message: string;
  timestamp: Date;
}

@Component({
  selector: 'app-cpf-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cpf-notifications-container p-4">
      <h3 class="text-xl font-bold mb-4">🔔 Real-time CPF Notifications</h3>

      <!-- Connection Status -->
      <div class="mb-4 p-3 rounded" [ngClass]="connectionStatusClass">
        <span class="font-semibold">
          {{ isConnected ? '✅ Connected to socket server' : '❌ Disconnected from socket server' }}
        </span>
      </div>

      <!-- Notification Count -->
      <div class="mb-4 text-gray-600">
        Total notifications received: <strong>{{ notifications.length }}</strong>
      </div>

      <!-- Test Button -->
      <button
        (click)="testConnection()"
        class="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        [disabled]="!isConnected">
        Test Socket Connection
      </button>

      <!-- Notifications List -->
      <div class="notifications-list space-y-3">
        <div *ngFor="let notification of notifications; let i = index"
             class="notification-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm">

          <div class="flex justify-between items-start mb-2">
            <h4 class="font-semibold text-green-600">New CPF Request #{{ i + 1 }}</h4>
            <span class="text-xs text-gray-500">{{ notification.timestamp | date:'short' }}</span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Citizen:</strong> {{ notification.citizenName }}</div>
            <div><strong>Email:</strong> {{ notification.citizenEmail }}</div>
            <div><strong>ID Number:</strong> {{ notification.identityNumber }}</div>
            <div><strong>Status:</strong>
              <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                {{ notification.status }}
              </span>
            </div>
          </div>

          <div class="mt-3 p-2 bg-gray-50 rounded text-sm">
            <strong>Address:</strong> {{ notification.address?.city }}, {{ notification.address?.state }}
          </div>

          <div class="mt-2 text-sm text-gray-600 italic">
            {{ notification.message }}
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="notifications.length === 0" class="text-center py-8 text-gray-500">
          <p>No CPF request notifications yet.</p>
          <p class="text-sm">When citizens submit CPF requests, you'll see them here in real-time!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cpf-notifications-container {
      max-height: 600px;
      overflow-y: auto;
    }

    .notification-card {
      border-left: 4px solid #10b981;
      transition: transform 0.2s ease;
    }

    .notification-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .connected {
      background-color: #d1fae5;
      color: #065f46;
    }

    .disconnected {
      background-color: #fee2e2;
      color: #991b1b;
    }
  `]
})
export class CPFNotificationsComponent implements OnInit, OnDestroy {
  notifications: CPFNotification[] = [];
  isConnected = false;
  private subscription: Subscription = new Subscription();

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    console.log('🔧 CPF Notifications component initialized');

    // Monitor connection status
    this.subscription.add(
      this.socketService.isConnected$.subscribe(connected => {
        this.isConnected = connected;
        console.log(`🔌 Socket connection status: ${connected ? 'Connected' : 'Disconnected'}`);
      })
    );

    // Listen for new CPF request notifications
    this.subscription.add(
      this.socketService.on<any>('new-cpf-request').subscribe({
        next: (data) => {
          console.log('🔔 New CPF request notification received:', data);
          this.addNotification(data);
        },
        error: (error) => {
          console.error('❌ Error receiving CPF notification:', error);
        }
      })
    );

    // Try to connect if not already connected
    if (!this.isConnected) {
      this.socketService.connect();
    }
  }

  ngOnDestroy(): void {
    console.log('🧹 Cleaning up CPF Notifications component');
    this.subscription.unsubscribe();
  }

  private addNotification(data: any): void {
    const notification: CPFNotification = {
      ...data,
      timestamp: new Date()
    };

    // Add to the beginning of the array (newest first)
    this.notifications.unshift(notification);

    // Keep only last 10 notifications to avoid memory issues
    if (this.notifications.length > 10) {
      this.notifications = this.notifications.slice(0, 10);
    }

    console.log(`📝 Added notification. Total count: ${this.notifications.length}`);
  }

  testConnection(): void {
    if (this.isConnected) {
      console.log('🧪 Testing socket connection...');

      // Add a test notification to verify the UI works
      this.addNotification({
        requestId: 'test-' + Date.now(),
        citizenName: 'Test User',
        citizenEmail: 'test@example.com',
        identityNumber: '123456789',
        address: { city: 'Test City', state: 'Test State' },
        status: 'pending',
        createdAt: new Date(),
        message: 'This is a test notification to verify the system works'
      });
    }
  }

  get connectionStatusClass(): string {
    return this.isConnected ? 'connected' : 'disconnected';
  }
}
