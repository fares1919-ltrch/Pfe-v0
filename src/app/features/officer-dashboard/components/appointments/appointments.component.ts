import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

interface Appointment {
  id: string;
  userName: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  status: string;
  userId: string;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule, 
    MatFormFieldModule, 
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
  @ViewChild('todayCards') todayCards!: ElementRef;
  @ViewChild('upcomingCards') upcomingCards!: ElementRef;

  todayAppointments: Appointment[] = [];
  upcomingAppointments: Appointment[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  scrollCards(section: 'today' | 'upcoming', direction: number) {
    const container = section === 'today' ? this.todayCards.nativeElement : this.upcomingCards.nativeElement;
    const scrollAmount = 320 * direction;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading = true;
    this.error = null;

    this.appointmentService.getTodayAppointements().subscribe({
      next: (res: any[]) => {
        console.log('Raw today appointments response:', res);
        this.todayAppointments = this.mapAppointments(res);
        console.log('Mapped today appointments:', this.todayAppointments);
        this.isLoading = false;
      },
      error: (err) => {
        this.handleError('Failed to load today\'s appointments');
        this.isLoading = false;
      }
    });

    this.appointmentService.getUpcomingAppointements().subscribe({
      next: (res: any[]) => {
        console.log('Raw upcoming appointments response:', res);
        this.upcomingAppointments = this.mapAppointments(res);
        console.log('Mapped upcoming appointments:', this.upcomingAppointments);
        this.isLoading = false;
      },
      error: (err) => {
        this.handleError('Failed to load upcoming appointments');
        this.isLoading = false;
      }
    });
  }

  private mapAppointments(data: any[]): Appointment[] {
    return data.map((item) => {
      console.log('Mapping appointment item:', item);
      const mappedAppointment = {
        id: item.appointmentID || item.appointmentId || item._id, // Try all possible ID fields
        userName: item.name || 'Unknown User',
        date: item.date || 'Not Specified',
        time: item.time || 'Not Specified',
        location: item.centerName || 'Not Specified',
        notes: item.service || 'No notes available',
        status: item.status || 'Unknown',
        userId: item.userId ,
      };
      console.log('Mapped appointment:', mappedAppointment);
      return mappedAppointment;
    });
  }

  private handleError(message: string) {
    this.error = message;
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  refreshAppointments() {
    this.loadAppointments();
  }

  cancelAppointment(appointmentId: string) {
    console.log('Cancelling appointment with ID:', appointmentId);
    if (!appointmentId) {
      this.handleError('Invalid appointment ID');
      return;
    }

    this.appointmentService.cancelAppointment(appointmentId).subscribe({
      next: () => {
        this.snackBar.open('Appointment cancelled successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
        this.loadAppointments();
      },
      error: (err) => {
        console.error('Error cancelling appointment:', err);
        this.handleError('Failed to cancel appointment');
      }
    });
  }

  markAsMissed(appointmentId: string) {
    console.log('Marking appointment as missed with ID:', appointmentId);
    if (!appointmentId) {
      this.handleError('Invalid appointment ID');
      return;
    }

    this.appointmentService.markAppointmentAsMissed(appointmentId).subscribe({
      next: () => {
        this.snackBar.open('Appointment marked as missed', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
        this.loadAppointments();
      },
      error: (err) => {
        console.error('Error marking appointment as missed:', err);
        this.handleError('Failed to mark appointment as missed');
      }
    });
  }

  viewDetails(userId: string, appointmentId: string) {
    console.log('Viewing details for appointment - userId:', userId);
    console.log('Viewing details for appointment - appointmentId:', appointmentId);
  
    if (!appointmentId || !userId) {
      console.error('appointmentId or userId is undefined');
      return;
    }
   this.router.navigate(['/officer-dashboard/data-submission', userId, appointmentId]);
  }
}