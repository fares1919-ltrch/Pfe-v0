import { Component, OnInit, Input } from '@angular/core';
import { CitizenWithoutCPF } from '../cpf-overview.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-cpf-pending-overview',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
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

  // Placeholder services - replace with actual injected services
  private notificationService: any; // Replace with actual NotificationService
  private router: any; // Replace with actual Router
  private modalService: any; // Replace with actual ModalService
  private confirmationService: any; // Replace with actual ConfirmationService
  private cpfService: any; // Replace with actual CPFService

  constructor() { }

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
    if (!this.citizen) {
      return;
    }

    // This is a placeholder - replace with actual modal open
    // this.modalService.open("appointment-reschedule-modal", {
    //   data: { citizenId: this.citizen.identityNumber },
    // });
    console.log('Reschedule appointment for citizen:', this.citizen.identityNumber);
  }

  cancelRequest(): void {
    if (!this.citizen) {
      return;
    }

    // This is a placeholder - replace with actual confirmation and service call
    // this.confirmationService.confirm({
    //   message: "Êtes-vous sûr de vouloir annuler cette demande de CPF?",
    //   accept: () => {
    //     this.cpfService.cancelRequest(this.citizen.identityNumber).subscribe(
    //       () => {
    //         this.notificationService.showSuccess("Demande annulée avec succès");
    //         this.router.navigate(["/dashboard"]);
    //       },
    //       (error) => {
    //         this.notificationService.showError(
    //           "Erreur lors de l'annulation de la demande"
    //         );
    //       }
    //     );
    //   },
    // });
    console.log('Cancel request for citizen:', this.citizen.identityNumber);
  }

  // Add other methods specific to the pending view if needed
}
