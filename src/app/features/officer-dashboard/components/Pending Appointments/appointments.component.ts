import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService, Appointment } from '../../../../core/services/appointment.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProfileService } from '../../../../core/services/profile.service';

interface MappedAppointment {
  id: string;
  date: string;
  time: string;
  status: string;
  userId: string;
  center?: {
    _id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      lat: number;
      lon: number;
    };
    region?: string;
  };
  user?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
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

  todayAppointments: MappedAppointment[] = [];
  upcomingAppointments: MappedAppointment[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  userCache: Map<string, any> = new Map();

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
    private profileService: ProfileService,
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

    // Load today's validated appointments
    this.appointmentService.getTodayValidatedAppointments().pipe(
      catchError(err => {
        console.error('Error loading today\'s validated appointments:', err);
        this.handleError('Failed to load today\'s appointments');
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(appointments => {
      console.log('Today validated appointments response:', appointments);

      if (Array.isArray(appointments)) {
        this.todayAppointments = this.mapAppointments(appointments);
      } else if (appointments && Array.isArray(appointments.appointments)) {
        this.todayAppointments = this.mapAppointments(appointments.appointments);
      } else {
        this.todayAppointments = [];
        console.warn('Unexpected format for today appointments:', appointments);
      }

      console.log('Mapped today validated appointments:', this.todayAppointments);
    });

    // Load upcoming validated appointments
    this.appointmentService.getValidatedAppointments().pipe(
      catchError(err => {
        console.error('Error loading upcoming validated appointments:', err);
        this.handleError('Failed to load upcoming appointments');
        return of({ appointments: [], total: 0, page: 1, pages: 1 });
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(response => {
      console.log('Upcoming validated appointments response:', response);

      if (response && Array.isArray(response.appointments)) {
        this.upcomingAppointments = this.mapAppointments(response.appointments);
      } else {
        this.upcomingAppointments = [];
        console.warn('Unexpected format for upcoming appointments:', response);
      }

      console.log('Mapped upcoming validated appointments:', this.upcomingAppointments);
    });
  }

  private mapAppointments(data: any[]): MappedAppointment[] {
    return data.map(item => {
      // Format date and time
      const appointmentDate = item.appointmentDate ? new Date(item.appointmentDate) : new Date();
      const formattedDate = appointmentDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return {
        id: item._id,
        userId: item.userId,
        date: formattedDate,
        time: formattedTime,
        status: item.status || 'Unknown',
        center: item.center,
        user: item.user,
      };
    });
  }

  // Fetch user data and cache it
  fetchUserData(userId: string): void {
    if (this.userCache.has(userId)) {
      return;
    }

    // For now, getUserProfile only supports current user
    // TODO: Implement getUserById in ProfileService and backend if needed
    // Example placeholder:
    // this.profileService.getUserById(userId).subscribe({ ... })
    // For now, show error or skip
    this.snackBar.open('Fetching user by ID is not yet supported.', 'Close', {
      duration: 3000,
      panelClass: 'error-snackbar'
    });
  }

  getUserName(userId: string | any): string {
    if (!userId) return 'Unknown User';

    // If userId is an object, it's already populated
    if (typeof userId !== 'string') {
      return `${userId.firstName || ''} ${userId.lastName || ''}`.trim() || userId.username || 'Unknown User';
    }

    // Check if we have the user in our cache
    const cachedUser = this.userCache.get(userId);
    if (cachedUser) {
      return `${cachedUser.firstName || ''} ${cachedUser.lastName || ''}`.trim() || cachedUser.username || 'Unknown User';
    }

    // If not cached yet, return a placeholder and fetch user data
    this.fetchUserData(userId);
    return 'Loading...';
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

    this.appointmentService.missAppointment(appointmentId).subscribe({
      next: () => {
        this.snackBar.open('Appointment marked as missed', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
        this.loadAppointments();
      },
      error: (err: any) => {
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

  completeAppointment(appointmentId: string) {
    this.isLoading = true;
    this.appointmentService.completeAppointment(appointmentId).subscribe({
      next: (response) => {
        this.snackBar.open('Appointment completed successfully', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.refreshAppointments();
      },
      error: (error) => {
        this.handleError('Failed to complete appointment');
        this.isLoading = false;
      }
    });
  }
}
