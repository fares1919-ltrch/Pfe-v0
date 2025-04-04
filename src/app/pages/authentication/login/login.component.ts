// angular import
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  providers: [AuthService, TokenStorageService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  rememberMe: boolean = true;

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if a token already exists
    const existingToken = this.tokenStorage.getToken();
    if (existingToken) {
      // Handle existing token (optional: redirect or refresh)
      console.log('Existing token found');
      this.router.navigate(['/profile']);
    }
  }

  onSubmit() {
    // Trim whitespace from username and password
    this.username = this.username?.trim() || '';
    this.password = this.password?.trim() || '';

    // Validate username and password
    if (!this.username) {
      console.error('Username is required');
      alert('Username is required');
      return;
    }

    if (!this.password) {
      console.error('Password is required');
      alert('Password is required');
      return;
    }

    // Disable submit button to prevent multiple submissions
    const submitButton = document.getElementById('login-submit-btn');
    if (submitButton) submitButton.setAttribute('disabled', 'true');

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        console.group('Login Successful');
        console.log('Login response:', res);

        // Re-enable submit button
        if (submitButton) submitButton.removeAttribute('disabled');

        if (res && res.accessToken) {
          // Clear any existing tokens first
          this.tokenStorage.signOut();

          // Save access token
          this.tokenStorage.saveToken(res.accessToken);

          // Save refresh token if exists
          if (res.refreshToken) {
            this.tokenStorage.saveRefreshToken(res.refreshToken);
          }

          // Save user details
          this.tokenStorage.saveUser(res);

          console.log('Login successful');

          // Detailed navigation logging
          console.log('Attempting to navigate to profile');
          this.router.navigate(['/profile'])
            .then(() => {
              console.log('Navigation to profile successful');
            })
            .catch(navErr => {
              console.group('Navigation Error');
              console.error('Failed to navigate to profile', navErr);
              console.log('Current URL:', this.router.url);
              console.log('Router state:', this.router.routerState);
              console.groupEnd();

              alert('Login successful, but unable to navigate to profile. Please contact support.');
            });
        } else {
          console.error('Login failed: Unexpected response', res);
          alert('Unexpected login response');
        }
        console.groupEnd();
      },
      error: (err) => {
        // Re-enable submit button
        if (submitButton) submitButton.removeAttribute('disabled');

        console.group('Login Error');
        console.error('Login failed', err);

        // Provide user-friendly error message
        const errorMessage = err.error?.message ||
                             err.message ||
                             'Login failed. Please check your credentials.';

        console.error('Detailed error:', {
          errorMessage,
          fullError: err
        });

        // Show error to user
        alert(errorMessage);
        console.groupEnd();
      }
    });
  }
}
