// angular import
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { Router } from '@angular/router';

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

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Optional: Check existing token or perform any initialization
    const existingToken = this.tokenStorage.getToken();
    if (existingToken) {
      console.log('Existing token found during registration');
    }
  }

  onSubmit(form: NgForm) {
    // Check form validity
    if (form.invalid) {
      console.error('Form is invalid');
      return;
    }

    // Validate password confirmation
    if (this.password !== this.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }

    // Validate terms agreement
    if (!this.termsAccepted) {
      console.error('You must agree to the terms');
      return;
    }

    this.authService.register(
      this.username,
      this.email,
      this.password,
      this.roles
    ).subscribe({
      next: (res) => {
        console.log('Registration successful', res);

        // Attempt to log in immediately after registration
        this.authService.login(this.username, this.password).subscribe({
          next: () => {
            // Navigate to profile after successful login
            this.router.navigate(['/account/profile']);
          },
          error: (loginErr) => {
            console.error('Automatic login failed after registration', loginErr);
            // Fallback to login page
            this.router.navigate(['/auth/login']);
          }
        });
      },
      error: (err) => {
        console.error('Registration failed', err);
        // Show user-friendly error message
        alert(err.message || 'Registration failed. Please try again.');
      }
    });
  }
}
