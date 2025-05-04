import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Appointment {
  _id: string;
  userId: string;
  appointmentDate: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  location: string;
  service: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-appointements',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchAppointments();
  }

  fetchAppointments(): void {
    this.loading = true;
    this.error = false;
    
    // Mocking appointment data for now
    setTimeout(() => {
      this.appointments = [
        {
          _id: 'app001',
          userId: 'user123',
          appointmentDate: '2023-12-30T10:00:00Z',
          status: 'scheduled',
          location: 'Main Office',
          service: 'Passport Renewal',
          notes: 'Bring identification documents',
          createdAt: '2023-12-10T08:30:00Z'
        },
        {
          _id: 'app002',
          userId: 'user123',
          appointmentDate: '2023-11-15T14:30:00Z',
          status: 'completed',
          location: 'City Branch',
          service: 'ID Card Application',
          createdAt: '2023-11-01T09:15:00Z',
          updatedAt: '2023-11-15T15:45:00Z'
        },
        {
          _id: 'app003',
          userId: 'user123',
          appointmentDate: '2023-10-05T11:00:00Z',
          status: 'cancelled',
          location: 'Regional Center',
          service: 'License Renewal',
          notes: 'Cancelled due to holiday',
          createdAt: '2023-09-20T13:20:00Z',
          updatedAt: '2023-10-01T10:10:00Z'
        }
      ];
      this.filteredAppointments = [...this.appointments];
      this.loading = false;
    }, 1000);
  }

  searchAppointments(query: string): void {
    this.searchQuery = query;
    if (!query) {
      this.filteredAppointments = [...this.appointments];
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    this.filteredAppointments = this.appointments.filter(appointment => {
      return (
        appointment.service.toLowerCase().includes(lowerQuery) ||
        appointment.location.toLowerCase().includes(lowerQuery) ||
        appointment.status.toLowerCase().includes(lowerQuery) ||
        (appointment.notes && appointment.notes.toLowerCase().includes(lowerQuery))
      );
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
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
  }
}
