import { Component, OnInit, ViewChild, ElementRef, Input, inject, PLATFORM_ID } from '@angular/core';
import { CitizenWithCPF } from '../cpf-overview.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CpfDocumentContentComponent } from '../cpf-document-content/cpf-document-content.component';
import { CPFDocument } from '../../../../../types/cpf-document.model'; // Import CPFDocument
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../../../core/services/notification.service';
import { CpfSimulationService } from '../../../../../core/services/cpf-simulation.service';

// We'll dynamically import html2pdf only in browser environment

@Component({
  selector: 'app-cpf-generated-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CpfDocumentContentComponent,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cpf-generated-overview.component.html',
  styleUrls: ['./cpf-generated-overview.component.scss']
})
export class CpfGeneratedOverviewComponent implements OnInit {
  @Input() set citizen(value: any) {
    if (value && 'cpf' in value) {
      this._citizen = value as CitizenWithCPF;
      // Map citizen data to CPFDocument structure when citizen data changes
      this.documentData = this.mapCitizenToCpfDocument(this._citizen);
    }
  }

  get citizen(): CitizenWithCPF | undefined {
    return this._citizen;
  }

  private _citizen: CitizenWithCPF | undefined;
  documentData: CPFDocument | undefined; // Add property to hold mapped document data

  @ViewChild(CpfDocumentContentComponent) documentContent!: CpfDocumentContentComponent;

  // New properties for enhanced functionality
  isCpfVisible: boolean = false;
  isDownloading: boolean = false;
  showConsultingModal: boolean = false;
  consultingComment: string = '';
  consultingType: string = '';
  contactPreference: string = 'email';
  isSubmittingConsulting: boolean = false;

  // Secret key properties
  showSecretKeyModal: boolean = false;
  enteredSecretKey: string = '';
  secretKey: string = '1111';
  secretKeyError: string = '';

  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  constructor(
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private simulationService: CpfSimulationService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // If no citizen data is provided via input, load placeholder data
    if (!this._citizen) {
      this._citizen = {
          fullName: "João Silva",
          profileImage: "path/to/image.jpg",
          identityNumber: "123456789",
          cpf: {
            number: "123.456.789-00",
            issueDate: new Date('2023-05-15'),
            expiryDate: new Date('2033-05-15'),
            status: "active"
          },
          deduplicationStatus: "verified",
          deduplicationDate: new Date('2023-05-10'),
          appointment: {
            date: new Date('2023-05-05'),
            location: "Centre Rio de Janeiro",
            officerName: "Maria Oliveira"
          }
      };

      // Map citizen data to CPFDocument structure
      this.documentData = this.mapCitizenToCpfDocument(this._citizen);
    }
  }

  mapCitizenToCpfDocument(citizen: CitizenWithCPF): CPFDocument {
    // This is a simplified mapping based on the guide's CPFDocument structure
    // You might need to adjust the data sources based on your actual CitizenWithCPF structure
    return {
      header: {
        logo: 'assets/images/coat of arms.jpg', // Brazilian government seal
        documentTitle: 'CERTIFICAT DE PERSONNE PHYSIQUE',
        documentId: 'DOC-2023-123456', // Placeholder ID
        generationDate: new Date()
      },
      personalInfo: {
        fullName: citizen.fullName.toUpperCase(),
        photo: 'assets/images/person face.jpg', // Use the person face image
        identityNumber: citizen.identityNumber,
        birthDate: new Date('1985-01-10'), // Placeholder birth date
        nationality: 'BRÉSILIENNE' // Placeholder nationality
      },
      cpfInfo: {
        number: citizen.cpf.number,
        issueDate: citizen.cpf.issueDate,
        expiryDate: citizen.cpf.expiryDate,
        status: citizen.cpf.status.toUpperCase(),
        qrCode: 'assets/images/qr code.png' // Use the actual QR code image path
      },
      collectionInfo: {
        appointmentDate: citizen.appointment.date,
        appointmentLocation: citizen.appointment.location.toUpperCase(),
        officerName: citizen.appointment.officerName.toUpperCase(),
        officerBadge: 'OFF-12345' // Placeholder badge
      },
      biometricInfo: {
        collectionDate: new Date('2023-05-05'), // Placeholder date
        verificationDate: citizen.deduplicationDate, // Assuming this is the verification date
        collectedTypes: ['EMPREINTES', 'VISAGE', 'IRIS'] // Placeholder types
      },
      footer: {
        legalText: 'Ce document est officiel. La falsification est un crime selon la loi brésilienne.',
        verificationUrl: 'https://cpf.gov.br/verify',
        contactInfo: 'support@cpf.gov.br | Tel: +55 0800 123 456'
      }
    };
  }

  async exportCPFDocument(): Promise<void> {
    if (!this.isBrowser) {
      return; // Don't execute in server-side rendering
    }

    if (!this.documentData) {
      this.notificationService.showError('Document data missing. Cannot export CPF document.');
      return;
    }

    this.isDownloading = true;

    try {
      // Simulate API call for download tracking
      await this.simulationService.downloadCpfDocument().toPromise();

      // Get the HTML element of the document content component
      const documentElement = this.documentContent?.elementRef?.nativeElement;

      if (!documentElement) {
        throw new Error('Document content element not found.');
      }

      // Dynamically import html2pdf only in browser environment
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      // Use html2pdf to generate and download the PDF
      await html2pdf(documentElement, {
        margin: 10,
        filename: `cpf_document_${this.citizen?.identityNumber || 'unknown'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      });

      this.notificationService.showSuccess('CPF document downloaded successfully!');
    } catch (error: any) {
      console.error('Error downloading CPF document:', error);
      this.notificationService.showError(
        error.message || 'Failed to download CPF document. Please try again.'
      );
    } finally {
      this.isDownloading = false;
    }
  }

  toggleCpfVisibility(): void {
    if (!this.isCpfVisible) {
      // Show secret key modal to reveal CPF
      this.showSecretKeyModal = true;
      this.enteredSecretKey = '';
      this.secretKeyError = '';
    } else {
      // Hide CPF directly
      this.isCpfVisible = false;
      this.notificationService.showInfo('CPF number is now hidden');
    }
  }

  closeSecretKeyModal(): void {
    this.showSecretKeyModal = false;
    this.enteredSecretKey = '';
    this.secretKeyError = '';
  }

  verifySecretKey(): void {
    if (this.enteredSecretKey === this.secretKey) {
      this.isCpfVisible = true;
      this.showSecretKeyModal = false;
      this.notificationService.showSuccess('CPF number is now visible');
      this.enteredSecretKey = '';
      this.secretKeyError = '';
    } else {
      this.secretKeyError = 'Invalid secret key. Please try again.';
      this.notificationService.showError('Invalid secret key');
    }
  }

  openConsultingModal(): void {
    this.showConsultingModal = true;
    this.consultingComment = '';
    this.consultingType = '';
    this.contactPreference = 'email';
  }

  closeConsultingModal(): void {
    this.showConsultingModal = false;
    this.consultingComment = '';
    this.consultingType = '';
    this.contactPreference = 'email';
    this.isSubmittingConsulting = false;
  }

  async submitConsultingDemand(): Promise<void> {
    if (!this.consultingComment.trim()) {
      this.notificationService.showWarning('Please provide a comment for your consulting demand.');
      return;
    }

    this.isSubmittingConsulting = true;

    try {
      const response = await this.simulationService.requestConsultingDemand(this.consultingComment).toPromise();

      this.notificationService.showSuccess(
        `Consulting demand submitted successfully! Request ID: ${response?.data?.requestId}.
        Estimated response time: ${response?.data?.estimatedResponse}`
      );

      this.closeConsultingModal();
    } catch (error: any) {
      console.error('Error submitting consulting demand:', error);
      this.notificationService.showError(
        error.message || 'Failed to submit consulting demand. Please try again.'
      );
    } finally {
      this.isSubmittingConsulting = false;
    }
  }

  getMaskedCpfNumber(): string {
    if (!this.citizen?.cpf?.number) return '';

    if (this.isCpfVisible) {
      return this.citizen.cpf.number;
    } else {
      // Mask the CPF number (show only first 3 and last 2 digits)
      const cpf = this.citizen.cpf.number.replace(/\D/g, ''); // Remove non-digits
      return `${cpf.substring(0, 3)}.***.**${cpf.substring(9, 11)}`;
    }
  }
}
