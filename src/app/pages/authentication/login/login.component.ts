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
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  returnUrl: string = '';

  // Email verification
  emailVerificationRequired: boolean = false;
  unverifiedEmail: string = '';

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Defensive: ensure all tokens are cleared
    this.tokenStorage.signOut();

    // Always clear the logout flag when on login page
    this.tokenStorage.clearLogoutFlag();

    // Get return url from route parameters if it exists
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    // Check if a token already exists
    const existingToken = this.tokenStorage.getToken();
    if (existingToken) {
      // If we have a specific return URL, use it
      if (this.returnUrl) {
        this.router.navigate([this.returnUrl]);
      } else {
        // Otherwise redirect based on user roles
        this.authService.redirectBasedOnUserRoles();
      }
    }

    // Check for OAuth callback with token parameter
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.handleOAuthRedirect(token);
    }

    // Check for registration success message from OAuth providers
    const registration = this.route.snapshot.queryParams['registration'];
    const provider = this.route.snapshot.queryParams['provider'];
    if (registration === 'success' && provider) {
      this.successMessage = `Registration with ${provider} successful! Please sign in to continue.`;
    }

    // Check for OAuth error
    const error = this.route.snapshot.queryParams['error'];
    if (error === 'oauth_error') {
      const errorProvider = this.route.snapshot.queryParams['provider'] || 'OAuth';
      this.errorMessage = `Authentication with ${errorProvider} failed. Please try again or use another method.`;
    }
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    // Trim whitespace from username and password
    this.username = this.username?.trim() || '';
    this.password = this.password?.trim() || '';

    // Validate username and password
    if (!this.username) {
      this.errorMessage = 'Username is required';
      this.isLoading = false;
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Password is required';
      this.isLoading = false;
      return;
    }

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.accessToken) {
          // Save tokens and user details
          this.tokenStorage.saveToken(res.accessToken);
          if (res.refreshToken) {
            this.tokenStorage.saveRefreshToken(res.refreshToken);
          }
          this.tokenStorage.saveUser(res);

          console.log('Login successful');

          // If we have a specific return URL, use it
          if (this.returnUrl) {
            console.log('Navigating to return URL:', this.returnUrl);
            this.router.navigate([this.returnUrl]);
          } else {
            // Otherwise redirect based on user roles
            console.log('Redirecting based on user roles');
            this.authService.redirectBasedOnUserRoles();
          }

        }
      },
      error: (error) => {
        this.isLoading = false;
        console.log('Login error response:', error);

        // Check if this is an email verification error
        if (error.error?.emailVerificationRequired) {
          this.emailVerificationRequired = true;
          this.unverifiedEmail = error.error.email;
          this.errorMessage = error.error.message || 'Please verify your email address before logging in.';
        } else if (error.status === 401) {
          // Handle other authentication errors
          this.emailVerificationRequired = false;
          this.errorMessage = error.error?.message || 'Invalid credentials. Please check your username and password.';
        } else if (error.status === 404) {
          this.emailVerificationRequired = false;

          // Check if this is a "User Not found" error
          if (error.error?.message === "User Not found.") {
            console.log('User not found during login attempt');
            this.errorMessage = 'Username not found.';
          } else {
            // API endpoint not found - likely a backend configuration issue
            console.error('API endpoint not found. Check backend configuration.');
            this.errorMessage = 'Login service is currently unavailable. Please try again later or contact support.';
          }
        } else if (error.status === 429) {
          // Rate limiting error
          this.emailVerificationRequired = false;
          console.log('Rate limiting triggered during login attempt');
          this.errorMessage = error.error?.message || 'Too many login attempts. Please wait before trying again.';
        } else {
          // Generic error
          this.emailVerificationRequired = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again later.';
        }
      }
    });
  }

  handleOAuthRedirect(token: string): void {
    // Clear logout flag to ensure proper login
    this.tokenStorage.clearLogoutFlag();

    this.tokenStorage.saveToken(token);

    // Get user info with token
    this.authService.getUserInfo(token).subscribe({
      next: (user) => {
        if (user && user.id) {
          this.tokenStorage.saveUser(user);
        }

        // If we have a specific return URL, use it
        if (this.returnUrl) {
          console.log('OAuth: Navigating to return URL:', this.returnUrl);
          this.router.navigate([this.returnUrl]);
        } else {
          // Otherwise redirect based on user roles
          console.log('OAuth: Redirecting based on user roles');
          this.authService.redirectBasedOnUserRoles();
        }
      },
      error: (error) => {
        console.error('Error getting user info after OAuth login:', error);
        // Even with an error, we still have the token, so redirect anyway
        if (this.returnUrl) {
          this.router.navigate([this.returnUrl]);
        } else {
          // Try to redirect based on roles, or fallback to citizen dashboard
          try {
            this.authService.redirectBasedOnUserRoles();
          } catch (e) {
            console.error('Failed to redirect based on roles, using fallback', e);
            this.router.navigate(['/citizen-dashboard']);
          }
        }
      }
    });
  }

  initiateGoogleAuth() {
    // Clear logout flag before Google auth
    this.tokenStorage.clearLogoutFlag();
    this.authService.initiateGoogleAuth();
  }

  /* Commenting out GitHub authentication as requested
  initiateGithubAuth() {
    // Clear logout flag before GitHub auth
    this.tokenStorage.clearLogoutFlag();
    this.authService.initiateGithubAuth();
  }
  */

  resendVerificationEmail() {
    if (!this.unverifiedEmail) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resendVerificationEmail(this.unverifiedEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Verification email has been sent. Please check your inbox.';
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Failed to resend verification email:', error);

        if (error.status === 404) {
          this.errorMessage = 'Email address not found. Please check your email or register a new account.';
        } else if (error.status === 429) {
          this.errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to send verification email. Please try again.';
        }
      }
    });
  }
}
