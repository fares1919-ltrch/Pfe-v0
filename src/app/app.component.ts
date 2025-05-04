import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from './core/services/token-storage.service';
import { Router, RouterModule, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from './core/services/auth.service';
import { catchError, switchMap, of, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    RouterOutlet,
    CommonModule
    
  ],
  providers: [CookieService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  username?: string;
  isInitializing = true; // Track initial app loading state
  isRefreshingToken = false; // Track token refresh state

  // Flag to prevent login redirect during page refresh
  private isPageRefresh = true;
  private isAuthenticatedRoute = false;

  constructor(
    private tokenStorageService: TokenStorageService,
    private router: Router,
    private cookieService: CookieService,
    private authService: AuthService
  ) {
    // Listen to router events to track navigation
    this.router.events.pipe(
      filter(event =>
        event instanceof NavigationStart ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      )
    ).subscribe(event => {
      // Handle navigation events
      if (event instanceof NavigationStart) {
        console.log('App: Navigation started to', event.url);

        // Check if this is an authenticated route
        this.isAuthenticatedRoute =
          event.url.includes('/profile') ||
          event.url.includes('/citizen-dashboard') ||
          event.url.includes('/officer-dashboard') ||
          event.url.includes('/manager-dashboard');

        // If we're navigating to an authenticated route, check for token
        if (this.isAuthenticatedRoute) {
          const hasToken = !!this.tokenStorageService.getToken();

          if (hasToken && this.isPageRefresh) {
            // If we have a token during page refresh, prevent login redirects
            console.log('App: Authenticated route with token during page refresh');

            // If we're trying to access the profile page, redirect to appropriate dashboard
            if (event.url.includes('/profile')) {
              console.log('App: Redirecting from profile to appropriate dashboard');
              // Use setTimeout to avoid navigation during navigation
              setTimeout(() => {
                this.authService.redirectBasedOnUserRoles();
              }, 100);
            }
          } else if (!hasToken) {
            // If no token, prevent navigation to protected routes
            console.log('App: Preventing navigation to protected route without token');

            // Only redirect if we're not already going to login
            if (!event.url.includes('/auth/login')) {
              this.router.navigate(['/auth/login'], {
                queryParams: { returnUrl: event.url }
              });
            }
          }
        }
      }

      if (event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError) {
        // Navigation completed
        this.isPageRefresh = false;
        this.isInitializing = false;
      }
    });
  }

  ngOnInit(): void {
    // Check if we have a token
    this.isLoggedIn = !!this.tokenStorageService.getToken();
    console.log('App: Initial token check -', this.isLoggedIn ? 'Token found' : 'No token');

    if (this.isLoggedIn) {
      const user = this.tokenStorageService.getUser();
      this.username = user?.username;

      // For authenticated routes during page refresh, refresh token immediately
      if (this.isPageRefresh && this.isAuthenticatedRoute) {
        console.log('App: Refreshing token for authenticated route during page refresh');
        this.isRefreshingToken = true;

        // Keep loading state active for a minimum time to prevent flashes
        const minLoadingTime = 500; // ms
        const startTime = Date.now();

        this.attemptTokenRefresh().subscribe({
          next: (response) => {
            // Calculate how much time has passed
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

            // Keep loading state for at least the minimum time
            setTimeout(() => {
              this.isRefreshingToken = false;
              console.log('App: Token refresh completed during page load');
            }, remainingTime);
          },
          error: () => {
            // Calculate how much time has passed
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

            // Keep loading state for at least the minimum time
            setTimeout(() => {
              this.isRefreshingToken = false;
            }, remainingTime);
          }
        });
      } else {
        // Normal session check for non-refresh scenarios
        this.authService.checkSession().pipe(
          catchError((error) => {
            console.error('Session check failed:', error);
            // If session check fails, try to refresh token
            return this.attemptTokenRefresh();
          })
        ).subscribe({
          next: (response) => {
            if (response.user) {
              this.tokenStorageService.saveUser(response.user);
              this.username = response.user.username;
            } else {
              // No active session, but we have a token - try to refresh
              this.attemptTokenRefresh().subscribe();
            }
          }
        });
      }
    } else {
      // No token, we're done initializing
      this.isInitializing = false;
    }
  }

  private attemptTokenRefresh() {
    const refreshToken = this.tokenStorageService.getRefreshToken();

    if (!refreshToken) {
      this.handleAuthFailure();
      return of(null);
    }

    return this.authService.refreshToken(refreshToken).pipe(
      switchMap(response => {
        if (response?.accessToken) {
          this.tokenStorageService.saveToken(response.accessToken);
          this.tokenStorageService.saveRefreshToken(response.refreshToken);
          return of(response);
        } else {
          this.handleAuthFailure();
          return of(null);
        }
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.handleAuthFailure();
        return of(null);
      })
    );
  }

  private handleAuthFailure() {
    this.tokenStorageService.signOut();
    this.router.navigate(['/auth/login']);
  }

  logout(): void {
    this.tokenStorageService.signOut();
    this.router.navigate(['/auth/login']);
  }
}
