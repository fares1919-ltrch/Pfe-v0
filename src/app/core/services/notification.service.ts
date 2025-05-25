import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) { }

  showSuccess(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showError(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showWarning(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showInfo(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
