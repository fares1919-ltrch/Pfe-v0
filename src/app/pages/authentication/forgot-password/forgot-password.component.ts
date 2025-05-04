import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';  // Add RouterModule here


@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],  // Add RouterModule here
  providers: [AuthService],
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    // Basic email validation
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password reset instructions have been sent to your email';

        // Navigate after a short delay to show the success message
        setTimeout(() => {
          this.router.navigate(['/auth/reset-password'], {
            state: { email: this.email } // Add email to state
          });
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Password reset error:', err);
        this.errorMessage = err.error?.message || 'Failed to send password reset email. Please try again.';
      }
    });
  }
}
