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

interface Appointment {
  _id: string;
  userId: string;
  appointmentDate: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed' | 'rejected' | 'pending';
  location: string;
  service: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

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
    MatIconModule
  ],
  templateUrl: './appointements.component.html',
  styleUrl: './appointements.component.css'
})
export class AppointementsComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  loading = true;
  error = false;
  selectedAppointment: Appointment | null = null;
  searchQuery = '';
  selectedDate: Date | null = null;
  selectedTime: string = '';
  isValidTime: boolean = false;
  showDeleteConfirm: boolean = false;
  appointmentToDelete: Appointment | null = null;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchAppointments();
  }

  fetchAppointments(): void {
    this.loading = true;
    this.error = false;
    
    // Mocking appointment data with one rejected appointment
    setTimeout(() => {
      this.appointments = [
        {
          _id: 'app001',
          userId: 'user123',
          appointmentDate: '2024-03-20T10:00:00Z',
          status: 'rejected',
          location: 'Main Office',
          service: 'Passport Renewal',
          notes: 'Application rejected due to incomplete documentation',
          createdAt: '2024-03-10T08:30:00Z'
        }
      ];
      this.filteredAppointments = [...this.appointments];
      this.loading = false;
    }, 1000);
  }

  searchAppointments(query: string): void {
    if (!query.trim()) {
      this.filteredAppointments = [...this.appointments];
      return;
    }
    
    const searchTerm = query.toLowerCase();
    this.filteredAppointments = this.appointments.filter(appointment => 
      appointment.service.toLowerCase().includes(searchTerm) ||
      appointment.location.toLowerCase().includes(searchTerm) ||
      appointment.status.toLowerCase().includes(searchTerm)
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  validateTime(event: any): void {
    const timeValue = event.target.value;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    this.isValidTime = timeRegex.test(timeValue);
  }

  onDateSelected(date: Date): void {
    this.selectedDate = date;
  }

  saveNewDateTime(): void {
    if (this.selectedDate && this.selectedTime && this.isValidTime && this.selectedAppointment) {
      const [hours, minutes] = this.selectedTime.split(':');
      const newDate = new Date(this.selectedDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      
      // TODO: Call API to update appointment
      console.log('New date and time:', newDate);
      
      // Update the appointment in the local array
      const index = this.appointments.findIndex(a => a._id === this.selectedAppointment?._id);
      if (index !== -1) {
        this.appointments[index].appointmentDate = newDate.toISOString();
        this.appointments[index].status = 'pending';
        this.filteredAppointments = [...this.appointments];
      }
      
      this.closeDetails();
    }
  }

  deleteAppointment(appointment: Appointment): void {
    this.appointmentToDelete = appointment;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (this.appointmentToDelete) {
      // TODO: Call API to delete appointment
      console.log('Deleting appointment:', this.appointmentToDelete._id);
      
      // Remove the appointment from the local array
      this.appointments = this.appointments.filter(a => a._id !== this.appointmentToDelete?._id);
      this.filteredAppointments = [...this.appointments];
      
      this.cancelDelete();
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.appointmentToDelete = null;
  }

  canChangeDate(appointment: Appointment): boolean {
    return appointment.status === 'rejected';
  }
}
