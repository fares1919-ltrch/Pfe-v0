import { Component, Input, Output, EventEmitter, OnInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
    ])
  ]
})
export class DashboardHeaderComponent implements OnInit {
  @Input() userRole: string = '';
  @Input() username: string = '';
  @Input() isSidebarCollapsed: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  userPhotoUrl: string = 'assets/images/avatar-placeholder.png';
  dropdownOpen = false;
  alwaysShowSidebar = false;
  isToggling = false;
  isProfileClicked = false;
  isLoggingOut = false;
  currentUser: any;
  private isBrowser: boolean;

  constructor(
    private profileService: ProfileService,
    private tokenStorage: TokenStorageService,
    private authService: AuthService,
    private router: Router,
    private cookieService: CookieService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
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

    this.isProfileClicked = false;
  }

  toggleDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    this.isProfileClicked = true;
    this.dropdownOpen = !this.dropdownOpen;
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
}
