import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from './core/services/token-storage.service';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from './core/services/auth.service';

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
      this.username = user.username;

      // Check session status with backend
      this.authService.checkSession().subscribe({
        next: (response) => {
          if (response.user) {
            this.tokenStorageService.saveUser(response.user);
            this.username = response.user.username;
          } else {
            // No active session, but we have a token - try to refresh
            const refreshToken = this.tokenStorageService.getRefreshToken();
            if (refreshToken) {
              this.authService.refreshToken(refreshToken).subscribe({
                next: (response) => {
                  if (response.accessToken) {
                    this.tokenStorageService.saveToken(response.accessToken);
                    this.tokenStorageService.saveRefreshToken(response.refreshToken);
                  } else {
                    this.tokenStorageService.signOut();
                    this.router.navigate(['/auth/login']);
                  }
                },
                error: (refreshError) => {
                  console.error('Token refresh failed:', refreshError);
                  this.tokenStorageService.signOut();
                  this.router.navigate(['/auth/login']);
                }
              });
            } else {
              this.tokenStorageService.signOut();
              this.router.navigate(['/auth/login']);
            }
          }
        },
        error: (error) => {
          console.error('Session check failed:', error);
          // If session check fails, try to refresh token
          const refreshToken = this.tokenStorageService.getRefreshToken();
          if (refreshToken) {
            this.authService.refreshToken(refreshToken).subscribe({
              next: (response) => {
                if (response.accessToken) {
                  this.tokenStorageService.saveToken(response.accessToken);
                  this.tokenStorageService.saveRefreshToken(response.refreshToken);
                } else {
                  this.tokenStorageService.signOut();
                  this.router.navigate(['/auth/login']);
                }
              },
              error: (refreshError) => {
                console.error('Token refresh failed:', refreshError);
                this.tokenStorageService.signOut();
                this.router.navigate(['/auth/login']);
              }
            });
          } else {
            this.tokenStorageService.signOut();
            this.router.navigate(['/auth/login']);
          }
        }
      });
    }
  }

  logout(): void {
    this.tokenStorageService.signOut();
    this.router.navigate(['/auth/login']);
  }
}
