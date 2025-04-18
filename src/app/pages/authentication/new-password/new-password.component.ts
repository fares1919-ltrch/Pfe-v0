// new-password.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Try to get token from navigation state
    const navigation = this.router.getCurrentNavigation();
    this.token = navigation?.extras?.state?.['token'] || '';
  }

  ngOnInit() {
    // Try to get token from URL parameter if not in navigation state
    if (!this.token) {
      this.route.params.subscribe(params => {
        this.token = params['token'] || '';
      });
    }

    // Try to get token from query parameters if not found elsewhere
    if (!this.token) {
      this.route.queryParams.subscribe(params => {
        this.token = params['token'] || '';
      });
    }

    console.log('Token found:', this.token);
  }

  onSubmit() {
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

    // Should use 'password' field name instead of 'newPassword'
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        console.log('Password reset successful');
        this.router.navigate(['/auth/login'], {
          state: { message: 'Your password has been reset successfully. You can now login with your new password.' }
        });
      },
      error: (err) => {
        console.error('Password reset error:', err);
        this.errorMessage = err.error?.message || 'Failed to reset password. Please try again.';
      }
    });
  }
}
