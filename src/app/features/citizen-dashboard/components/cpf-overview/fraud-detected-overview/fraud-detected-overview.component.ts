import { Component, OnInit, Input } from '@angular/core';
import { CitizenWithFraud } from '../cpf-overview.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
// Assuming Router is needed for navigation
// import { Router } from '@angular/router'; // Uncomment and import if needed

@Component({
  selector: 'app-fraud-detected-overview',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
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

  // Placeholder services - replace with actual injected services
  // private router: Router; // Uncomment if using actual service

  constructor(/* private router: Router */) { }

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
    if (!this.citizen || !this.citizen.identityNumber) {
      console.warn('Contest fraud aborted: Citizen data or ID missing');
      return;
    }

    // This is a placeholder - replace with actual navigation
    // this.router.navigate(["/fraud-contest", this.citizen.identityNumber]);
    console.log('Contest fraud for citizen:', this.citizen.identityNumber);
  }

  // Add other methods specific to the fraud view if needed
}
