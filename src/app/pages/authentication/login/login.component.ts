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
  returnUrl: string = '/profile';

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get return url from route parameters or default to '/profile'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/profile';

    // Check if a token already exists
    const existingToken = this.tokenStorage.getToken();
    if (existingToken) {
      this.router.navigate([this.returnUrl]);
    }

    // Check for OAuth callback
    const code = this.route.snapshot.queryParams['code'];
    const provider = this.route.snapshot.queryParams['provider'];
    if (code && provider) {
      this.handleOAuthCallback(code, provider);
    }
  }

  onSubmit() {
    this.errorMessage = '';
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

  handleOAuthCallback(code: string, provider: string) {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.handleOAuthCallback(code, provider).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.accessToken) {
          // Token storage is handled in the service
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'OAuth authentication failed. Please try again.';
      }
    });
  }

  initiateGoogleAuth() {
    this.authService.initiateGoogleAuth();
  }

  initiateGithubAuth() {
    this.authService.initiateGithubAuth();
  }
}
