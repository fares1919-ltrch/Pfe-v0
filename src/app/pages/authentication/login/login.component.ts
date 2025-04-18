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
  returnUrl: string = '/profile';

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Always clear the logout flag when on login page
    this.tokenStorage.clearLogoutFlag();

    // Get return url from route parameters or default to '/profile'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/profile';

    // Check if a token already exists
    const existingToken = this.tokenStorage.getToken();
    if (existingToken) {
      this.router.navigate([this.returnUrl]);
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

          console.log('Login successful, navigating to', this.returnUrl);

          // Navigate to return URL
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
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
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        console.error('Error getting user info after OAuth login:', error);
        // Even with an error, we still have the token, so redirect anyway
        this.router.navigate([this.returnUrl]);
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
}
