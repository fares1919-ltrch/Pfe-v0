// reset-password.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';  // Add RouterModule here
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [AuthService],
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  token = '';
  email = '';
  isResending = false;
  resendDisabled = false;
  countdown = 30;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.email = navigation?.extras?.state?.['email'] || '';
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
      })
  }
}