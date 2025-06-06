import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppointmentService, Appointment } from '../../../../core/services/appointment.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-appointements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './appointements.component.html',
  styleUrl: './appointements.component.css'
})
export class AppointementsComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  isLoading = false;
  error: string | null = null;
  selectedAppointment: Appointment | null = null;
  searchQuery: string = '';
  selectedDate: Date | null = null;
  selectedTime: string = '';
  isValidTime = false;
  showDeleteConfirm: boolean = false;
  appointmentToDelete: Appointment | null = null;

  // Reschedule modal
  showRescheduleModal = false;
  newDate: Date | null = null;
  newTime: string | null = null;
  minDate = new Date();
  isRescheduling = false;
  availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  // Cancel modal
  showCancelModal = false;
  isCancelling = false;

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Set minimum date to tomorrow
    this.minDate.setDate(this.minDate.getDate() + 1);
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.error = null;

    this.appointmentService.getUserAppointments().subscribe({
      next: (response) => {
        if (response && Array.isArray(response.appointments)) {
          this.appointments = response.appointments;
          this.filteredAppointments = [...this.appointments];
        } else {
          console.error('Unexpected response format:', response);
          this.error = 'Invalid response format received from the server';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading appointments:', err);
        this.error = err.message || 'Failed to load appointments';
        this.isLoading = false;
      }
    });
  }

  fetchAppointments(): void {
    this.loadAppointments();
  }

  filterAppointments(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery = searchValue;

    if (!searchValue) {
      this.filteredAppointments = [...this.appointments];
      return;
    }

    this.filteredAppointments = this.appointments.filter(appointment => {
      // Search in center name
      const centerName = appointment.center?.name?.toLowerCase() || '';

      // Search in appointment date
      const appointmentDate = this.formatDate(appointment.appointmentDate);

      // Search in status
      const status = appointment.status.toLowerCase();

      // Search in ID
      const id = appointment._id.toLowerCase();

      return centerName.includes(searchValue) ||
             appointmentDate.includes(searchValue) ||
             status.includes(searchValue) ||
             id.includes(searchValue);
    });
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  isPastAppointment(date: Date | string | undefined): boolean {
    if (!date) return false;

    const appointmentDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();

    return appointmentDate < now;
  }

  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return 'Not set';

    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getLocation(appointment: Appointment): string {
    if (appointment.center && appointment.center.name) {
      return appointment.center.name;
    }
    return 'Location not specified';
  }

  viewAppointmentDetails(appointment: Appointment): void {
    this.selectedAppointment = appointment;
  }

  closeDetails(): void {
    this.selectedAppointment = null;
    this.selectedDate = null;
    this.selectedTime = '';
    this.isValidTime = false;
  }

  changeDate(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.selectedDate = new Date(appointment.appointmentDate);
    this.selectedTime = this.formatTimeFromDate(new Date(appointment.appointmentDate));
    this.validateTime({ target: { value: this.selectedTime } } as any);
  }

  formatTimeFromDate(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  validateTime(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    // Time format validation (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const isValid = timeRegex.test(inputValue);

    this.isValidTime = isValid;

    if (isValid) {
      // Parse hours and minutes
      const [hours, minutes] = inputValue.split(':').map(Number);

      // Check if the time is within business hours (9 AM to 5 PM)
      const isBusinessHours = (hours >= 9 && hours < 17) || (hours === 17 && minutes === 0);

      this.isValidTime = isBusinessHours;

      if (!isBusinessHours) {
        this.snackBar.open('Please select a time between 9:00 AM and 5:00 PM', 'Close', { duration: 3000 });
      }
    }
  }

  onDateSelected(date: Date): void {
    this.selectedDate = date;
  }

  saveNewDateTime(): void {
    if (this.selectedDate && this.selectedTime && this.isValidTime && this.selectedAppointment) {
      const [hours, minutes] = this.selectedTime.split(':');
      const newDate = new Date(this.selectedDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      this.appointmentService.rescheduleAppointment(this.selectedAppointment._id, newDate.toISOString())
        .subscribe({
          next: (response) => {
            this.snackBar.open('Appointment rescheduled successfully', 'Close', {
              duration: 3000,
              panelClass: 'success-snackbar'
            });
            this.fetchAppointments();
            this.closeDetails();
          },
          error: (error) => {
            console.error('Error rescheduling appointment', error);
            this.snackBar.open('Failed to reschedule appointment', 'Close', {
              duration: 3000,
              panelClass: 'error-snackbar'
            });
          }
        });
    }
  }

  deleteAppointment(appointment: Appointment): void {
    this.appointmentToDelete = appointment;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (this.appointmentToDelete) {
      this.appointmentService.deleteAppointment(this.appointmentToDelete._id)
        .subscribe({
          next: () => {
            this.snackBar.open('Appointment deleted successfully', 'Close', {
              duration: 3000,
              panelClass: 'success-snackbar'
            });
            this.fetchAppointments();
            this.cancelDelete();
          },
          error: (error) => {
            console.error('Error deleting appointment', error);
            this.snackBar.open('Failed to delete appointment', 'Close', {
              duration: 3000,
              panelClass: 'error-snackbar'
            });
            this.cancelDelete();
          }
        });
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.appointmentToDelete = null;
  }

  canChangeDate(appointment: Appointment): boolean {
    return ['rejected', 'pending', 'validated'].includes(appointment.status);
  }

  // Reschedule modal methods
  openRescheduleModal(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    // Initialize with the current appointment date
    const appointmentDate = new Date(appointment.appointmentDate);
    // Set new date to the current appointment date + 1 day (to ensure it's in the future)
    this.newDate = new Date(appointmentDate);
    this.newDate.setDate(this.newDate.getDate() + 1);
    // Set new time to the current appointment time (HH:mm, 24-hour format)
    this.newTime = appointmentDate.getHours().toString().padStart(2, '0') + ':' +
                  appointmentDate.getMinutes().toString().padStart(2, '0');
    this.showRescheduleModal = true;
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.selectedAppointment = null;
    this.newDate = null;
    this.newTime = null;
  }

  rescheduleAppointment(): void {
    if (!this.selectedAppointment || !this.newDate || !this.newTime) {
      this.snackBar.open('Please select a date and time', 'Close', { duration: 3000 });
      return;
    }
    this.isRescheduling = true;
    // Create new date object with selected date and time
    const [hours, minutes] = this.newTime.split(':').map(Number);
    const newDateTime = new Date(this.newDate);
    newDateTime.setHours(hours, minutes, 0, 0);
    // Send ISO string to service
    this.appointmentService.rescheduleAppointment(
      this.selectedAppointment._id,
      newDateTime.toISOString()
    ).subscribe({
      next: () => {
        this.snackBar.open('Appointment rescheduled successfully', 'Close', { duration: 3000 });
        this.closeRescheduleModal();
        this.loadAppointments();
        this.isRescheduling = false;
      },
      error: (err) => {
        console.error('Error rescheduling appointment:', err);
        this.snackBar.open(
          err.error?.message || 'Failed to reschedule appointment',
          'Close',
          { duration: 5000 }
        );
        this.isRescheduling = false;
      }
    });
  }

  // Cancel modal methods
  openCancelModal(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.selectedAppointment = null;
  }

  cancelAppointment(): void {
    if (!this.selectedAppointment) {
      this.snackBar.open('No appointment selected', 'Close', { duration: 3000 });
      return;
    }

    this.isCancelling = true;

    this.appointmentService.cancelAppointment(this.selectedAppointment._id).subscribe({
      next: () => {
        this.snackBar.open('Appointment cancelled successfully', 'Close', { duration: 3000 });
        this.closeCancelModal();
        this.loadAppointments();
        this.isCancelling = false;
      },
      error: (err) => {
        console.error('Error cancelling appointment:', err);
        this.snackBar.open(
          err.error?.message || 'Failed to cancel appointment',
          'Close',
          { duration: 5000 }
        );
        this.isCancelling = false;
      }
    });
  }
}
