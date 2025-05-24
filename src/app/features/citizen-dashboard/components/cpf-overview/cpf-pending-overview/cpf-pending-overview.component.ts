import { Component, OnInit, Input } from '@angular/core';
import { CitizenWithoutCPF } from '../cpf-overview.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../../../core/services/notification.service';
import { CpfSimulationService } from '../../../../../core/services/cpf-simulation.service';

@Component({
  selector: 'app-cpf-pending-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cpf-pending-overview.component.html',
  styleUrls: ['./cpf-pending-overview.component.scss']
})
export class CpfPendingOverviewComponent implements OnInit {
  @Input() set citizen(value: any) {
    if (value && 'cpfRequest' in value) {
      this._citizen = value as CitizenWithoutCPF;
    }
  }

  get citizen(): CitizenWithoutCPF | undefined {
    return this._citizen;
  }

  private _citizen: CitizenWithoutCPF | undefined;

  // Appointment management properties
  selectedDate: Date | null = null;
  selectedTime: string = '';
  isValidTime: boolean = false;
  showAppointmentModal: boolean = false;
  showDeleteConfirm: boolean = false;

  // Loading states
  isUpdatingAppointment: boolean = false;
  isDeletingAppointment: boolean = false;
  isCancellingRequest: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private simulationService: CpfSimulationService
  ) { }

  ngOnInit(): void {
    // If no citizen data is provided via input, load placeholder data
    if (!this._citizen) {
      this._citizen = {
          fullName: "João Silva",
          profileImage: "path/to/image.jpg",
          identityNumber: "123456789",
          cpfRequest: {
            status: "pending",
            requestDate: new Date('2023-05-01')
          },
          appointment: {
            date: new Date('2023-05-15'),
            location: "Centre Rio de Janeiro",
            status: "scheduled"
          }
      };
    }
  }

  rescheduleAppointment(): void {
    if (!this.citizen?.appointment) {
      return;
    }

    this.selectedDate = new Date(this.citizen.appointment.date);
    this.selectedTime = this.formatTimeFromDate(new Date(this.citizen.appointment.date));
    this.validateTime({ target: { value: this.selectedTime } } as any);
    this.showAppointmentModal = true;
  }

  closeAppointmentModal(): void {
    this.showAppointmentModal = false;
    this.selectedDate = null;
    this.selectedTime = '';
    this.isValidTime = false;
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

  async saveNewDateTime(): Promise<void> {
    if (this.selectedDate && this.selectedTime && this.isValidTime && this.citizen?.appointment) {
      const [hours, minutes] = this.selectedTime.split(':');
      const newDate = new Date(this.selectedDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));

      this.isUpdatingAppointment = true;

      try {
        await this.simulationService.updateAppointment(newDate).toPromise();

        // Update the appointment in the citizen data
        if (this.citizen.appointment) {
          this.citizen.appointment.date = newDate;
          this.citizen.appointment.status = 'scheduled';
        }

        this.notificationService.showSuccess('Appointment updated successfully!');
        this.closeAppointmentModal();
      } catch (error: any) {
        console.error('Error updating appointment:', error);
        this.notificationService.showError(
          error.message || 'Failed to update appointment. Please try again.'
        );
      } finally {
        this.isUpdatingAppointment = false;
      }
    }
  }

  deleteAppointment(): void {
    this.showDeleteConfirm = true;
  }

  async confirmDeleteAppointment(): Promise<void> {
    if (this.citizen?.appointment) {
      this.isDeletingAppointment = true;

      try {
        await this.simulationService.deleteAppointment().toPromise();

        // Remove the appointment from the citizen data
        this.citizen.appointment = undefined;

        this.notificationService.showSuccess('Appointment deleted successfully!');
        this.cancelDeleteAppointment();
      } catch (error: any) {
        console.error('Error deleting appointment:', error);
        this.notificationService.showError(
          error.message || 'Failed to delete appointment. Please try again.'
        );
      } finally {
        this.isDeletingAppointment = false;
      }
    }
  }

  cancelDeleteAppointment(): void {
    this.showDeleteConfirm = false;
  }

  canChangeAppointment(): boolean {
    return this.citizen?.appointment?.status === 'scheduled';
  }

  async cancelRequest(): Promise<void> {
    if (!this.citizen) {
      return;
    }

    // Show confirmation before proceeding
    if (!confirm('Are you sure you want to cancel your CPF request? This action cannot be undone.')) {
      return;
    }

    this.isCancellingRequest = true;

    try {
      await this.simulationService.cancelCpfRequest().toPromise();

      this.notificationService.showSuccess('CPF request cancelled successfully!');

      // Update the citizen data to reflect cancellation
      if (this.citizen.cpfRequest) {
        this.citizen.cpfRequest.status = 'pending'; // Reset to initial state for simulation
      }

    } catch (error: any) {
      console.error('Error cancelling CPF request:', error);
      this.notificationService.showError(
        error.message || 'Failed to cancel CPF request. Please try again.'
      );
    } finally {
      this.isCancellingRequest = false;
    }
  }

  // Add other methods specific to the pending view if needed
}
