import { Component, OnInit, Input } from '@angular/core';
import { CitizenWithFraud } from '../cpf-overview.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../../../core/services/notification.service';
import { CpfSimulationService } from '../../../../../core/services/cpf-simulation.service';

@Component({
  selector: 'app-fraud-detected-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './fraud-detected-overview.component.html',
  styleUrls: ['./fraud-detected-overview.component.scss']
})
export class FraudDetectedOverviewComponent implements OnInit {
  @Input() set citizen(value: any) {
    if (value && 'fraudDetails' in value) {
      this._citizen = value as CitizenWithFraud;
    }
  }

  get citizen(): CitizenWithFraud | undefined {
    return this._citizen;
  }

  private _citizen: CitizenWithFraud | undefined;

  // Contest fraud properties
  showContestModal: boolean = false;
  contestReason: string = '';
  selectedContestType: string = '';
  isSubmittingContest: boolean = false;

  // Details modal properties
  showDetailsModal: boolean = false;

  contestTypes = [
    { value: 'identity_verification', label: 'Identity Verification Issue' },
    { value: 'false_positive', label: 'False Positive Detection' },
    { value: 'data_error', label: 'Data Entry Error' },
    { value: 'system_malfunction', label: 'System Malfunction' },
    { value: 'other', label: 'Other Reason' }
  ];

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
          fraudDetails: {
            detectionDate: new Date('2023-05-10'),
            status: "under_investigation",
            type: "duplicate_registration",
            caseNumber: "FR-2023-12345",
            matchedWith: {
              userId: "some-user-id",
              similarityScore: 92
            }
          },
          appointment: {
            date: new Date('2023-05-05'),
            location: "Centre Rio de Janeiro",
            officerName: "Maria Oliveira"
          }
      };
    }
  }

  contestFraud(): void {
    this.showContestModal = true;
    this.contestReason = '';
    this.selectedContestType = '';
  }

  closeContestModal(): void {
    this.showContestModal = false;
    this.contestReason = '';
    this.selectedContestType = '';
    this.isSubmittingContest = false;
  }

  async submitContestFraud(): Promise<void> {
    if (!this.selectedContestType || !this.contestReason.trim()) {
      this.notificationService.showWarning('Please select a contest type and provide a reason.');
      return;
    }

    if (!this.citizen || !this.citizen.identityNumber) {
      this.notificationService.showError('Citizen data missing. Cannot submit contest.');
      return;
    }

    this.isSubmittingContest = true;

    try {
      const response = await this.simulationService.contestFraud(this.contestReason).toPromise();

      this.notificationService.showSuccess(
        `Fraud contest submitted successfully! Contest ID: ${response?.data?.contestId}.
        Estimated review time: ${response?.data?.estimatedReview}`
      );

      // Update fraud status to show contest is under review
      if (this.citizen.fraudDetails) {
        this.citizen.fraudDetails.status = 'appealed';
      }

      this.closeContestModal();
    } catch (error: any) {
      console.error('Error submitting fraud contest:', error);
      this.notificationService.showError(
        error.message || 'Failed to submit fraud contest. Please try again.'
      );
    } finally {
      this.isSubmittingContest = false;
    }
  }

  getFraudTypeLabel(): string {
    const type = this.citizen?.fraudDetails?.type;
    switch (type) {
      case 'identity_theft':
        return 'Identity Theft';
      case 'duplicate_registration':
        return 'Duplicate Registration';
      case 'document_forgery':
        return 'Document Forgery';
      default:
        return 'Unknown';
    }
  }

  getFraudStatusLabel(): string {
    const status = this.citizen?.fraudDetails?.status;
    switch (status) {
      case 'under_investigation':
        return 'Under Investigation';
      case 'confirmed':
        return 'Confirmed';
      case 'appealed':
        return 'Appeal Submitted';
      default:
        return 'Unknown';
    }
  }

  openDetailsModal(): void {
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
  }

  // Add other methods specific to the fraud view if needed
}
