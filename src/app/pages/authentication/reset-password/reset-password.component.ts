// reset-password.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  token = '';
  email = '';
  isResending = false;
  resendDisabled = false;
  countdown = 30;
  tokenFromUrl = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Extract data from navigation state (from forgot-password)
    const navigation = this.router.getCurrentNavigation();
    this.email = navigation?.extras?.state?.['email'] || '';
  }

  ngOnInit() {
    // Check if token is in URL params (direct link from email)
    this.route.params.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
        this.tokenFromUrl = true;
        // If token is in URL, go directly to new password
        this.router.navigate(['/auth/new-password'], {
          state: { token: this.token }
        });
      }
    });
  }

  // Add resendCode method
  async resendCode() {
    if (!this.email || this.resendDisabled) return;

    this.isResending = true;
    try {
      // Should call forgotPassword instead of resendResetToken
      await this.authService.forgotPassword(this.email).toPromise();
      this.startCountdown();
    } catch (error) {
      console.error('Resend failed:', error);
    }
    this.isResending = false;
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
    this.router.navigate(['/auth/new-password'], {
      state: { token: this.token }
    });
  }
}
