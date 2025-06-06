import { Component, Input, Output, EventEmitter, OnInit, HostListener, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { CookieService } from 'ngx-cookie-service';
import { NotificationService } from '../../../core/services/notification.service';
import { SocketService } from '../../../core/services/socket.service';
import { Subscription } from 'rxjs';
import { RealTimeNotificationsComponent } from '../real-time-notifications/real-time-notifications.component';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterModule, RealTimeNotificationsComponent],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss'],
  animations: [
    trigger('rotateAnimation', [
      transition(':enter', [
        style({ transform: 'rotate(0deg)' }),
        animate('300ms ease-out', style({ transform: 'rotate(180deg)' }))
      ]),
      transition(':leave', [
        style({ transform: 'rotate(180deg)' }),
        animate('300ms ease-in', style({ transform: 'rotate(0deg)' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(0)' }),
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class DashboardHeaderComponent implements OnInit, OnDestroy {
  @Input() userRole: string = '';
  @Input() username: string = '';
  @Input() isSidebarCollapsed: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  userPhotoUrl: string = 'assets/images/avatar-placeholder.png';
  dropdownOpen = false;
  notificationsOpen = false;
  alwaysShowSidebar = false;
  isToggling = false;
  isProfileClicked = false;
  isLoggingOut = false;
  currentUser: any;
  unreadNotificationsCount = 0;
  private isBrowser: boolean;
  private subscriptions: Subscription[] = [];

  constructor(
    private profileService: ProfileService,
    private tokenStorage: TokenStorageService,
    private authService: AuthService,
    private router: Router,
    private cookieService: CookieService,
    private notificationService: NotificationService,
    private socketService: SocketService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.userRole === 'admin') {
      return;
    }
    this.currentUser = this.tokenStorage.getUser();
    if (this.currentUser) {
      this.username = this.currentUser.username;
      this.userRole = this.currentUser.roles?.[0]?.replace('ROLE_', '') || 'User';
      if (this.currentUser.photoUrl) {
        this.userPhotoUrl = this.currentUser.photoUrl;
      }
    }

    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.username = profile.username || this.username;
          this.userPhotoUrl = profile.photoUrl || this.userPhotoUrl;
        }
      },
      error: () => {
        // fallback to placeholder
      }
    });

    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadNotificationsCount = count;
      })
    );

    this.socketService.connect();

    this.updateUnreadCount();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  logout(): void {
    this.isLoggingOut = true;
    this.authService.logoutAndRedirect(this.currentUser, this.cookieService, this.isBrowser);
    this.isLoggingOut = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!this.isProfileClicked && !target.closest('.user-profile') && this.dropdownOpen) {
      this.dropdownOpen = false;
    }

    if (!target.closest('.notification-btn') && !target.closest('.notifications-panel') && this.notificationsOpen) {
      this.notificationsOpen = false;
    }

    this.isProfileClicked = false;
  }

  toggleDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    this.isProfileClicked = true;
    this.dropdownOpen = !this.dropdownOpen;

    if (this.notificationsOpen) {
      this.notificationsOpen = false;
    }
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationsOpen = !this.notificationsOpen;

    if (this.dropdownOpen) {
      this.dropdownOpen = false;
    }

    if (this.notificationsOpen && this.unreadNotificationsCount > 0) {
      this.updateUnreadCount();
    }
  }

  private updateUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      error: (error) => {
        console.error('Failed to fetch unread notification count', error);
      }
    });
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.dropdownOpen = false;
  }

  onMenuClick(): void {
    if (this.isToggling) return;

    this.isToggling = true;
    this.toggleSidebar.emit();

    setTimeout(() => {
      this.isToggling = false;
    }, 400);
  }

  onNotificationPanelToggled(isOpen: boolean): void {
    this.notificationsOpen = isOpen;
  }
}
