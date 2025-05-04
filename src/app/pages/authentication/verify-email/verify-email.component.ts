import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  isVerifying = false;
  isSuccess = false;
  isError = false;
  message = '';
  token = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Get token from query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.verifyEmail();
      } else {
        this.isError = true;
        this.message = 'Verification token is missing. Please check your email link.';
      }
    });
  }

  verifyEmail(): void {
    this.isVerifying = true;
    this.isSuccess = false;
    this.isError = false;
    this.message = 'Verifying your email...';

    this.authService.verifyEmail(this.token).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.isSuccess = true;
        this.message = 'Your email has been verified successfully! You can now log in.';
      },
      error: (err) => {
        this.isVerifying = false;
        this.isError = true;
        console.error('Email verification error:', err);

        // Handle specific error cases
        if (err.status === 404) {
          this.message = 'Invalid verification token. Please check your email or request a new verification link.';
        } else if (err.status === 410) {
          this.message = 'This verification link has expired. Please request a new verification link.';
        } else {
          this.message = err.error?.message || 'Failed to verify email. The token may be invalid or expired.';
        }
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
