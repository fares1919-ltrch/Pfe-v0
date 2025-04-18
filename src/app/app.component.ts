import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from './core/services/token-storage.service';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from './core/services/auth.service';
import { catchError, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    RouterOutlet,
    CommonModule,
  ],
  providers: [CookieService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  username?: string;

  constructor(
    private tokenStorageService: TokenStorageService,
    private router: Router,
    private cookieService: CookieService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = !!this.tokenStorageService.getToken();

    if (this.isLoggedIn) {
      const user = this.tokenStorageService.getUser();
      this.username = user?.username;

      // Check session status with backend
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
