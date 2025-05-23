import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { PLATFORM_ID } from '@angular/core';
import { CpfGeneratedOverviewComponent } from './cpf-generated-overview/cpf-generated-overview.component';
import { CpfPendingOverviewComponent } from './cpf-pending-overview/cpf-pending-overview.component';
import { FraudDetectedOverviewComponent } from './fraud-detected-overview/fraud-detected-overview.component';

// Export interfaces for use in other components
export interface CitizenWithCPF {
  // Informations personnelles de base
  fullName: string;
  profileImage: string;
  identityNumber: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };

  // Informations CPF
  cpf: {
    number: string;
    issueDate: Date;
    expiryDate: Date;
    status: "active" | "suspended" | "expired";
  };

  // Informations de déduplication
  deduplicationStatus: "verified";
  deduplicationDate: Date;

  // Informations du rendez-vous
  appointment: {
    date: Date;
    location: string;
    officerName: string;
  };
}

export interface CitizenWithoutCPF {
  // Informations personnelles de base
  fullName: string;
  profileImage: string;
  identityNumber: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };

  // Statut de la demande CPF
  cpfRequest: {
    status: "pending" | "approved" | "scheduled";
    requestDate: Date;
  };

  // Informations du rendez-vous (si programmé)
  appointment?: {
    date: Date;
    location: string;
    status: "scheduled" | "completed" | "missed";
  };
}

export interface CitizenWithFraud {
  // Informations personnelles de base
  fullName: string;
  profileImage: string;
  identityNumber: string;

  // Informations de fraude
  fraudDetails: {
    detectionDate: Date;
    status: "under_investigation" | "confirmed" | "appealed";
    type: "identity_theft" | "duplicate_registration" | "document_forgery";
    caseNumber: string;
    matchedWith?: {
      userId: string;
      similarityScore: number;
    };
  };

  // Informations du rendez-vous
  appointment: {
    date: Date;
    location: string;
    officerName: string;
  };
}

interface CPFStatus {
  number: string;
  status: 'active' | 'blocked' | 'pending';
  lastUpdate: string;
}

@Component({
  selector: 'app-cpf-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatDialogModule,
    FormsModule,
    CpfGeneratedOverviewComponent,
    CpfPendingOverviewComponent,
    FraudDetectedOverviewComponent
  ],
  templateUrl: './cpf-overview.component.html',
  styleUrls: ['./cpf-overview.component.css']
})
export class CPFOverviewComponent implements OnInit {
  @Input() citizenId: string | undefined;

  // Properties for the case-specific views
  citizen: CitizenWithCPF | CitizenWithoutCPF | CitizenWithFraud | undefined;
  viewMode: "cpf_generated" | "cpf_pending" | "fraud_detected" | undefined;

  // Properties for the CPF overview
  cpfStatus: CPFStatus = {
    number: '123.456.789-00',
    status: 'active',
    lastUpdate: '2024-03-15T10:30:00Z'
  };

  consultingDemandComment: string = '';
  showConsultingDemandDialog = false;

  isCpfHidden: boolean = true;

  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.citizenId) {
      this.loadCitizenData();
    }
  }

  determineViewMode(): void {
    if (this.citizen) {
      if ('fraudDetails' in this.citizen) {
        this.viewMode = 'fraud_detected';
      } else if ('cpf' in this.citizen && this.citizen.cpf?.number) {
        this.viewMode = 'cpf_generated';
      } else {
        this.viewMode = 'cpf_pending';
      }
    }
  }

  loadCitizenData(): void {
    // Placeholder data for demonstration
    // In a real application, this would fetch data from a service

    // For demonstration, we'll use the CPF generated case
    this.citizen = {
      fullName: "João Silva",
      profileImage: "path/to/image.jpg",
      identityNumber: "123456789",
      cpf: {
        number: "123.456.789-00",
        issueDate: new Date(),
        expiryDate: new Date(),
        status: "active"
      },
      deduplicationStatus: "verified",
      deduplicationDate: new Date(),
      appointment: {
        date: new Date(),
        location: "Centre Rio de Janeiro",
        officerName: "Maria Oliveira"
      }
    } as CitizenWithCPF;

    this.determineViewMode();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  requestConsultingDemand(): void {
    this.consultingDemandComment = '';
    this.showConsultingDemandDialog = true;
  }

  confirmConsultingDemand(): void {
    console.log('Consulting Demand confirmed with comment:', this.consultingDemandComment);
    this.showConsultingDemandDialog = false;

    this.snackBar.open('Consulting demand submitted successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  cancelConsultingDemand(): void {
    this.consultingDemandComment = '';
    this.showConsultingDemandDialog = false;
  }

  toggleCpfVisibility(): void {
    if (!this.isBrowser) {
      return; // Don't execute in server-side rendering
    }

    if (this.isCpfHidden) {
      const secretKey = prompt('Enter your secret key to show CPF:');
      if (secretKey === 'your_secret_key') {
        this.isCpfHidden = false;
      } else {
        this.snackBar.open('Incorrect secret key', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    } else {
      this.isCpfHidden = true;
    }
  }

  downloadCPF() {
    if (!this.isBrowser) {
      return; // Don't execute in server-side rendering
    }

    const content = `CPF Number: ${this.cpfStatus.number}\nStatus: ${this.cpfStatus.status}\nLast Update: ${this.formatDate(this.cpfStatus.lastUpdate)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cpf_${this.cpfStatus.number}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
