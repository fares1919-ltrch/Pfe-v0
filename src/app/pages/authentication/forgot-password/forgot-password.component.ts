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
  constructor(private authService: AuthService, private router: Router) {}
  onSubmit() {
    this.authService.forgotPassword(this.email).subscribe({
      next: () => this.router.navigate(['/auth/reset-password'], {
        state: { email: this.email } // Add email to state
      }),
      error: (err) => console.error(err)
    });
  }

}
