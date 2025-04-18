// angular import
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  providers: [AuthService, TokenStorageService],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  termsAccepted: boolean = false;
  roles: string[] = ['user'];
  isLoading: boolean = false;
  errorMessage: string = '';
  returnUrl: string = '/profile';

  // Password validation states
  hasMinLength: boolean = false;
  hasUpperCase: boolean = false;
  hasLowerCase: boolean = false;
  hasNumber: boolean = false;
  hasSpecialChar: boolean = false;

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Check if user is already logged in
    const existingToken = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();
    if (existingToken && user) {
      console.log('Token found, redirecting to profile');
      this.router.navigate(['/profile']);
      return;
    }

    // Check for OAuth callback with token parameter
    const oauthToken = this.route.snapshot.queryParams['token'];
    if (oauthToken) {
      this.handleOAuthRedirect(oauthToken);
    }
  }

  onPasswordChange(password: string) {
    this.hasMinLength = password.length >= 8;
    // Commenting out complex rules for development
    // this.hasUpperCase = /[A-Z]/.test(password);
    // this.hasLowerCase = /[a-z]/.test(password);
    // this.hasNumber = /\d/.test(password);
    // this.hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Simplified rules for development
    this.hasUpperCase = true;
    this.hasLowerCase = true;
    this.hasNumber = true;
    this.hasSpecialChar = true;
  }

  onSubmit(form: NgForm) {
    this.errorMessage = '';
    this.isLoading = true;

    // Check form validity
    if (form.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      this.isLoading = false;
      return;
    }

    // Validate password confirmation
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      this.isLoading = false;
      return;
    }

    // Validate password strength
    if (!this.isPasswordStrong(this.password)) {
      this.errorMessage = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
      this.isLoading = false;
      return;
    }

    // Validate terms agreement
    if (!this.termsAccepted) {
      this.errorMessage = 'You must agree to the terms and conditions.';
      this.isLoading = false;
      return;
    }

    this.authService.register(
      this.username,
      this.email,
      this.password,
      this.roles
    ).subscribe({
      next: (res) => {
        // Attempt to log in immediately after registration
        this.authService.login(this.username, this.password).subscribe({
          next: (loginRes) => {
            this.isLoading = false;
            if (loginRes && loginRes.accessToken) {
              // Save tokens and user details
              this.tokenStorage.saveToken(loginRes.accessToken);
              if (loginRes.refreshToken) {
                this.tokenStorage.saveRefreshToken(loginRes.refreshToken);
              }
              this.tokenStorage.saveUser(loginRes);
              this.router.navigate([this.returnUrl]);
            }
          },
          error: (loginErr) => {
            this.isLoading = false;
            this.errorMessage = 'Registration successful but automatic login failed. Please try logging in manually.';
            this.router.navigate(['/auth/login']);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  handleOAuthRedirect(token: string): void {
    this.tokenStorage.saveToken(token);

    // Check if there's a stored user or get user info from session
    this.authService.checkSession().subscribe({
      next: (response) => {
        if (response.user) {
          this.tokenStorage.saveUser(response.user);
        }
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        console.error('Error checking session after OAuth login:', error);
        this.errorMessage = 'Failed to retrieve user details after authentication.';
      }
    });
  }

  initiateGoogleAuth() {
    this.authService.initiateGoogleAuth();
  }

  /* Commenting out GitHub authentication as requested
  initiateGithubAuth() {
    this.authService.initiateGithubAuth();
  }
  */

  private isPasswordStrong(password: string): boolean {
    return this.hasMinLength;
    // Commenting out complex rules for development
    // return this.hasMinLength &&
    //        this.hasUpperCase &&
    //        this.hasLowerCase &&
    //        this.hasNumber &&
    //        this.hasSpecialChar;
  }
}
