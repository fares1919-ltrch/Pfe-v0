// reset-password.component.ts
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';  // Add ActivatedRoute

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [AuthService],
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  // Using 'token' variable name for consistency with HTML, but it's actually a verification code
  token = ''; // This is the 6-digit verification code
  email = '';
  isResending = false;
  resendDisabled = false;
  countdown = 30;
  tokenFromUrl = false;
  isVerifying = false;
  errorMessage = '';
  showError = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Extract data from navigation state (from forgot-password)
    const navigation = this.router.getCurrentNavigation();
    this.email = navigation?.extras?.state?.['email'] || '';
  }

  ngOnInit() {
    // Check if we're in the browser environment
    if (isPlatformBrowser(this.platformId)) {
      // First check if token is in the URL path (most common case from email link)
      const urlPath = window.location.pathname;
      const tokenMatch = urlPath.match(/\/auth\/reset-password\/(.+)/);

      if (tokenMatch && tokenMatch[1]) {
        this.token = tokenMatch[1];
        this.tokenFromUrl = true;
        console.log('Token extracted from URL path:', this.token);
        console.log('Token length:', this.token.length);
        console.log('Token type:', typeof this.token);

        // Navigate to new password with the token
        // Use setTimeout to ensure navigation happens after component is fully initialized
        setTimeout(() => {
          console.log('Navigating to new-password with token:', this.token);
          this.router.navigate(['/auth/new-password'], {
            state: { token: this.token } // Pass token in state
          });
        }, 100);
        return; // Exit early since we found the token
      }
    }

    // Check if token is in URL params
    this.route.params.subscribe(params => {
      if (params['token'] && !this.tokenFromUrl) {
        this.token = params['token'];
        this.tokenFromUrl = true;
        console.log('Token found in URL params:', this.token);
        console.log('Token length:', this.token.length);
        console.log('Token type:', typeof this.token);

        // Navigate to new password with the token
        setTimeout(() => {
          console.log('Navigating to new-password with token from params:', this.token);
          this.router.navigate(['/auth/new-password'], {
            state: { token: this.token } // Pass token in state
          });
        }, 100);
      }
    });

    // Also check query parameters for token
    this.route.queryParams.subscribe(params => {
      if (params['token'] && !this.tokenFromUrl) {
        this.token = params['token'];
        this.tokenFromUrl = true;
        console.log('Token found in query params:', this.token);
        console.log('Token length:', this.token.length);
        console.log('Token type:', typeof this.token);

        // Navigate to new password with the token
        setTimeout(() => {
          console.log('Navigating to new-password with token from query params:', this.token);
          this.router.navigate(['/auth/new-password'], {
            state: { token: this.token } // Pass token in state
          });
        }, 100);
      }
    });
  }

  // Resend verification code method
  resendCode() {
    if (!this.email || this.resendDisabled) return;

    this.isResending = true;
    this.showError = false;

    // Use subscribe instead of deprecated toPromise()
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.startCountdown();
        this.isResending = false;
      },
      error: (error) => {
        console.error('Resend failed:', error);
        this.errorMessage = 'Failed to resend verification code. Please try again.';
        this.showError = true;
        this.isResending = false;
      }
    });
  }

  private startCountdown() {
    this.resendDisabled = true;
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
        this.resendDisabled = false;
        this.countdown = 30;
      }
    }, 1000);
  }

  verifyToken() {
    if (!this.token) {
      this.errorMessage = 'Please enter the verification code';
      this.showError = true;
      return;
    }

    if (!this.email) {
      this.errorMessage = 'Email information is missing. Please go back to the forgot password page.';
      this.showError = true;
      return;
    }

    this.isVerifying = true;
    this.showError = false;

    // Important: The backend expects 'code' parameter, and our service method is named verifyResetCode
    // but we're using 'token' variable in our component for consistency with HTML
    console.log('Verifying code:', this.email, this.token);

    // Here we're passing the 6-digit code as the second parameter
    this.authService.verifyResetCode(this.email, this.token).subscribe({
      next: (response) => {
        this.isVerifying = false;
        console.log('Verification successful, received token:', response);

        // Navigate to new password page with the reset token from the response
        // This is a different token than the verification code we sent
        this.router.navigate(['/auth/new-password'], {
          state: { token: response.token }
        });
      },
      error: (err) => {
        this.isVerifying = false;
        console.error('Verification failed:', err);
        this.errorMessage = err.error?.message || 'Invalid verification code. Please try again.';
        this.showError = true;
      }
    });
  }
}
