import { Component, OnInit, OnDestroy, HostListener, Output, EventEmitter, ElementRef, Renderer2, Input } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { SocketService } from '../../../core/services/socket.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

interface Notification {
  _id: string;
  type: string;
  title?: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId?: string;
  metadata?: any;
}

@Component({
  selector: 'app-real-time-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatBadgeModule,
    MatButtonModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './real-time-notifications.component.html',
  styleUrls: ['./real-time-notifications.component.scss']
})
export class RealTimeNotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isOpen: boolean = false;
  private destroy$ = new Subject<void>();
  private notificationSound: HTMLAudioElement | undefined;
  private socketSubscription: Subscription | null = null;
  private flashingInterval: any = null;

  @Output() notificationPanelToggled = new EventEmitter<boolean>();
  @Input() userRole: string = '';

  constructor(
    private notificationService: NotificationService,
    private socketService: SocketService,
    private tokenStorage: TokenStorageService,
    private snackBar: MatSnackBar,
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef
  ) {
    // Initialize notification sound with better error handling
    this.initializeNotificationSound();
  }

  private initializeNotificationSound(): void {
    try {
      // First try to load using Audio API
      this.notificationSound = new Audio();
      this.notificationSound.src = 'assets/sounds/notification.mp3';
      this.notificationSound.volume = 0.7;
      this.notificationSound.load();

      // Preload the sound
      this.notificationSound.addEventListener('canplaythrough', () => {
        console.log('Notification sound loaded successfully');
      });

      this.notificationSound.addEventListener('error', (e) => {
        console.error('Error loading notification sound:', e);
        // Try alternative approach if this fails
        this.createBackupSound();
      });
    } catch (err) {
      console.warn('Could not initialize notification sound using Audio API:', err);
      this.createBackupSound();
    }
  }

  private createBackupSound(): void {
    // Create a backup sound element if the Audio API approach fails
    try {
      const soundElement = document.createElement('audio');
      soundElement.id = 'notification-sound';
      soundElement.src = 'assets/sounds/notification.mp3';
      soundElement.style.display = 'none';
      document.body.appendChild(soundElement);

      // Use this as our notification sound
      this.notificationSound = soundElement as HTMLAudioElement;
      this.notificationSound.volume = 0.7;
    } catch (err) {
      console.error('Failed to create backup notification sound:', err);
    }
  }

  private playNotificationSound(): void {
    try {
      if (this.notificationSound) {
        console.log('Attempting to play notification sound');
        // Reset to beginning
        this.notificationSound.currentTime = 0;

        // Use Promise to handle play outcome
        const playPromise = this.notificationSound.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Notification sound played successfully');
            })
            .catch(err => {
              console.warn('Error playing notification sound:', err);
              // Try an alternative approach
              this.playBackupSound();
            });
        }
      } else {
        console.warn('Notification sound not initialized');
        this.playBackupSound();
      }
    } catch (err) {
      console.error('Error playing notification sound:', err);
      this.playBackupSound();
    }
  }

  private playBackupSound(): void {
    // Fallback method if regular audio playback fails
    try {
      const soundElement = document.getElementById('notification-sound') as HTMLAudioElement;
      if (soundElement) {
        soundElement.currentTime = 0;
        soundElement.play().catch(err => {
          console.error('Failed to play backup notification sound:', err);
        });
      } else {
        // Last resort - create and play inline
        const tempSound = new Audio('assets/sounds/notification.mp3');
        tempSound.volume = 0.7;
        tempSound.play().catch(err => {
          console.error('Failed to play temporary notification sound:', err);
        });
      }
    } catch (err) {
      console.error('All attempts to play notification sound failed:', err);
    }
  }

  ngOnInit(): void {
    if (this.userRole === 'admin') {
      return;
    }
    // Ensure socket is connected
    this.socketService.connect();

    // Fetch initial notifications
    this.loadNotifications();

    // Listen for new notifications via socket
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Ensure we're only subscribing once
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }

    // Create subscription array for all notification types
    const subscriptions: Subscription[] = [];

    // Regular notifications
    subscriptions.push(
      this.socketService.onNotificationReceived()
        .pipe(takeUntil(this.destroy$))
        .subscribe((notification: Notification) => {
          console.log('Regular notification received:', notification);
          this.handleNewNotification(notification);
        })
    );

    // Appointment updates
    subscriptions.push(
      this.socketService.onAppointmentUpdate()
        .pipe(takeUntil(this.destroy$))
        .subscribe((notification: Notification) => {
          console.log('Appointment update notification received:', notification);
          this.handleNewNotification(notification);
        })
    );

    // Role-specific notifications
    subscriptions.push(
      this.socketService.onRoleNotification()
        .pipe(takeUntil(this.destroy$))
        .subscribe((notification: Notification) => {
          console.log('Role notification received:', notification);
          this.handleNewNotification(notification);
        })
    );

    // Combine all subscriptions
    this.socketSubscription = new Subscription();
    subscriptions.forEach(sub => this.socketSubscription?.add(sub));

    // Also subscribe to socket connection/disconnection events
    this.socketService.isConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        console.log('Socket connection status:', connected);
        if (connected) {
          console.log('Socket connected, loading notifications');
          this.loadNotifications();
        } else {
          console.log('Socket disconnected');
        }
      });
  }

  // Common handler for all notification types
  private handleNewNotification(notification: Notification): void {
    // Add the new notification to the beginning of the list
    this.notifications.unshift(notification);
    this.unreadCount++;

    // Play notification sound
    this.playNotificationSound();

    // Start flashing the icon
    this.startFlashingIcon();

    // Show a toast notification
    this.showToastNotification(notification);

    // Also show browser notification
    this.notificationService.showBrowserNotification(
      notification.title || 'New Notification',
      notification.message
    );
  }

  private startFlashingIcon(): void {
    // Clear any existing interval
    if (this.flashingInterval) {
      clearInterval(this.flashingInterval);
    }

    const iconEl = this.el.nativeElement.querySelector('.notification-icon');
    if (!iconEl) return;

    let isHighlighted = false;

    this.flashingInterval = setInterval(() => {
      isHighlighted = !isHighlighted;

      if (isHighlighted) {
        this.renderer.addClass(iconEl, 'notification-flashing');
      } else {
        this.renderer.removeClass(iconEl, 'notification-flashing');
      }
    }, 500);

    // Stop flashing after 10 seconds
    setTimeout(() => {
      if (this.flashingInterval) {
        clearInterval(this.flashingInterval);
        this.renderer.removeClass(iconEl, 'notification-flashing');
      }
    }, 10000);
  }

  private showToastNotification(notification: Notification): void {
    const config = {
      duration: 5000,
      horizontalPosition: 'end' as const,
      verticalPosition: 'top' as const,
      panelClass: ['notification-toast']
    };
    // Use plain text for the snackbar label, fallback to message if title is missing
    const label = (notification.title ? notification.title + ': ' : '') + (notification.message || '');
    const snackBarRef = this.snackBar.open(label, 'View', config);
    snackBarRef.onAction().subscribe(() => {
      this.router.navigate([this.getNotificationRoute(notification)]);
      this.markAsRead(notification._id);
    });
  }

  private getNotificationRoute(notification: Notification): string {
    // Determine appropriate route based on notification type
    if (notification.type === 'appointment') {
      const user = this.tokenStorage.getUser();
      if (user?.roles?.includes('ROLE_OFFICER')) {
        return '/officer-dashboard/appointments';
      } else {
        return '/citizen-dashboard/appointment';
      }
    } else if (notification.type === 'verification') {
      return '/officer-dashboard/cpf-notifications';
    } else {
      return '/dashboard';
    }
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data.notifications || [];
        this.calculateUnreadCount();
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
      }
    });
  }

  calculateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  toggleNotifications(): void {
    this.isOpen = !this.isOpen;
    this.notificationPanelToggled.emit(this.isOpen);

    // If panel is being closed, stop flashing
    if (!this.isOpen && this.flashingInterval) {
      clearInterval(this.flashingInterval);
      const iconEl = this.el.nativeElement.querySelector('.notification-icon');
      if (iconEl) {
        this.renderer.removeClass(iconEl, 'notification-flashing');
      }
    }
  }

  closeNotifications(): void {
    this.isOpen = false;
    this.notificationPanelToggled.emit(false);
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const notification = this.notifications.find(n => n._id === id);
        if (notification) {
          notification.read = true;
          this.calculateUnreadCount();
        }
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
      },
      error: (err) => {
        console.error('Error marking all notifications as read:', err);
      }
    });
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: any): void {
    const clickedInside = this.el.nativeElement.contains(event.target);
    if (!clickedInside && this.isOpen) {
      this.closeNotifications();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.flashingInterval) {
      clearInterval(this.flashingInterval);
    }

    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }

  openAllNotifications(): void {
    this.router.navigate(['/citizen-dashboard/notifications']);
  }
}
