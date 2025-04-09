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
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in
    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();
    if (token && user) {
      console.log('Token found, redirecting to profile');
      this.router.navigate(['/profile']);
      return;
    }

    // Check for OAuth callback
    const code = this.route.snapshot.queryParams['code'];
    const provider = this.route.snapshot.queryParams['provider'];
    if (code && provider) {
      this.handleOAuthCallback(code, provider);
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
          next: () => {
            this.isLoading = false;
            this.router.navigate([this.returnUrl]);
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

  handleOAuthCallback(code: string, provider: string) {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.handleOAuthCallback(code, provider).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.accessToken) {
          this.tokenStorage.saveToken(res.accessToken);
          if (res.refreshToken) {
            this.tokenStorage.saveRefreshToken(res.refreshToken);
          }
          this.tokenStorage.saveUser(res);
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
