// new-password.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
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
export class NewPasswordComponent {
  newPassword = '';
  confirmPassword = '';
  token = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.token = navigation?.extras?.state?.['token'] || '';
  }

  onSubmit() {
    if (this.newPassword === this.confirmPassword) {
      // Should use 'password' field name instead of 'newPassword'
      this.authService.resetPassword(this.token, this.newPassword).subscribe({
        next: () => this.router.navigate(['/auth/login']),
        error: (err) => console.error(err)
      });
    }
  }
}