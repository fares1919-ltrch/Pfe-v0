import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: any;
  menuOpen: boolean = false;
  dashboardLink: string = '/dashboard';
  faBars = faBars;
  faTimes = faTimes;
  isLoggingOut = false;
  private isBrowser: boolean;

  constructor(
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

    // Determine dashboard link based on user role
    if (this.currentUser && this.currentUser.roles) {
      if (this.currentUser.roles.includes('ROLE_OFFICER')) {
        this.dashboardLink = '/officer-dashboard';
      } else if (this.currentUser.roles.includes('ROLE_MANAGER')) {
        this.dashboardLink = '/manager-dashboard';
      } else {
        // Default to citizen dashboard
        this.dashboardLink = '/citizen-dashboard/dashboard';
      }
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    console.log('Profile: Logging out...');
    this.isLoggingOut = true;

    // Get the provider before we clear the tokens
    const provider = this.currentUser?.provider;
    console.log('Profile: User auth provider:', provider);

    // Store returnUrl for after logout
    const returnUrl = encodeURIComponent(window.location.origin + '/auth/login');

    // First handle server-side logout for all users
    this.authService.logout().subscribe({
      next: () => {
        console.log('Profile: Server-side logout successful');
        // Clear local storage and cookies for all users
        this.tokenStorage.signOut();

        // Forcefully clear all cookies to ensure complete logout
        this.cookieService.deleteAll('/');

        // If this is a Google user, use a more aggressive logout approach
        if (provider === 'google') {
          console.log('Profile: Google user - handling special logout');

          // Set logout flag explicitly in session storage (persists even if localStorage is cleared)
          if (this.isBrowser && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('google-logout', 'true');
          }

          // Force redirect to login page with logout parameter
          window.location.href = '/auth/login?logout=true&provider=google';

          // Optionally open Google logout in a new tab for complete logout
          if (this.isBrowser) {
            setTimeout(() => {
              window.open('https://accounts.google.com/Logout', '_blank');
            }, 100);
          }
        } else {
          // For non-Google users, simply redirect
          window.location.replace('/auth/login');
        }
      },
      error: (err) => {
        console.error('Profile: Logout error:', err);
        // Still clear client-side data even if server logout fails
        this.tokenStorage.signOut();

        // Forcefully clear all cookies on error too
        this.cookieService.deleteAll('/');

        // Handle the Google case even on error
        if (provider === 'google') {
          // Force navigation to login page with logout parameter
          if (this.isBrowser && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('google-logout', 'true');
          }
          window.location.href = '/auth/login?logout=true&provider=google';
        } else {
          window.location.replace('/auth/login');
        }
      },
      complete: () => {
        this.isLoggingOut = false;
      }
    });
  }
}
