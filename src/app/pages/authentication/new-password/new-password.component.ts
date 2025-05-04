// new-password.component.ts
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [AuthService],
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.scss']

})
export class NewPasswordComponent implements OnInit {
  newPassword = '';
  confirmPassword = '';
  token = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Try to get token from navigation state
    const navigation = this.router.getCurrentNavigation();
    this.token = navigation?.extras?.state?.['token'] || '';

    // Also check history state (for when page is refreshed)
    if (isPlatformBrowser(this.platformId) && !this.token && history.state && history.state.token) {
      this.token = history.state.token;
      console.log('Token found in history state:', this.token);
    }

    console.log('Token in constructor:', this.token);
  }

  ngOnInit() {
    // Check if we're in the browser environment
    if (isPlatformBrowser(this.platformId)) {
      // First, try to get token from navigation state (from previous page)
      if (!this.token && history.state && history.state.token) {
        this.token = history.state.token;
        console.log('Token found in navigation state:', this.token);
      }

      // If we still don't have a token, extract it from the URL path
      // This is the case when clicking the link from the email
      if (!this.token) {
        const urlPath = window.location.pathname;
        const tokenMatch = urlPath.match(/\/auth\/new-password\/(.+)/);
        if (tokenMatch && tokenMatch[1]) {
          this.token = tokenMatch[1];
          console.log('Token extracted from URL path:', this.token);
        }
      }

      // If we still don't have a token, check if we're redirected from reset-password with a token
      if (!this.token) {
        const fullUrl = window.location.href;
        const tokenMatch = fullUrl.match(/\/auth\/reset-password\/(.+)/);
        if (tokenMatch && tokenMatch[1]) {
          this.token = tokenMatch[1];
          console.log('Token extracted from reset-password URL:', this.token);
        }
      }

      console.log('Token after browser checks:', this.token);
    }

    // If not in navigation state, try to get from URL parameters
    if (!this.token) {
      this.route.params.subscribe(params => {
        if (params['token']) {
          this.token = params['token'];
          console.log('Token found in URL params:', this.token);
        }
      });
    }

    // Try to get token from query parameters if not found elsewhere
    if (!this.token) {
      this.route.queryParams.subscribe(params => {
        if (params['token']) {
          this.token = params['token'];
          console.log('Token found in query params:', this.token);
        }
      });
    }

    console.log('Final token value:', this.token);
    console.log('Token length:', this.token ? this.token.length : 0);
    console.log('Token type:', typeof this.token);

    // If we still don't have a token, show an error
    if (!this.token) {
      this.errorMessage = 'Reset token is missing. Please use the link from your email or request a new password reset.';
    }
  }

  onSubmit() {
    // Clear previous error message
    this.errorMessage = '';

    // Validate inputs
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please enter and confirm your new password.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Reset token is missing. Please use the link from your email.';
      return;
    }

    // Basic password strength validation
    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    console.log('Resetting password with token:', this.token);
    console.log('Token length:', this.token.length);
    console.log('Token type:', typeof this.token);

    // Show loading state
    this.isLoading = true;

    // Call the resetPassword method with the token and new password
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response) => {
        console.log('Password reset successful:', response);
        this.isLoading = false;
        this.router.navigate(['/auth/login'], {
          state: { message: 'Your password has been reset successfully. You can now login with your new password.' }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Password reset error:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.error?.message || 'Unknown error');

        // Handle different error cases
        if (err.status === 404) {
          this.errorMessage = 'Invalid or expired reset token. Please request a new password reset.';
        } else if (err.status === 400) {
          // For 400 Bad Request errors, show the specific message from the server if available
          this.errorMessage = err.error?.message || 'Invalid request. Please check your input and try again.';
        } else if (err.status === 0) {
          // Network error
          this.errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          // Generic error message for other cases
          this.errorMessage = err.error?.message || 'Failed to reset password. Please try again.';
        }

        // If the error is about an invalid token, suggest requesting a new reset
        if (this.errorMessage.includes('Invalid or expired reset token')) {
          this.errorMessage += ' You can request a new password reset from the login page.';
        }
      }
    });
  }
}
