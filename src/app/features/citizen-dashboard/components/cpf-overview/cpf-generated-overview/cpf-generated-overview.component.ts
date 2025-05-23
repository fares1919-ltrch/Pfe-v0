import { Component, OnInit, ViewChild, ElementRef, Input, inject, PLATFORM_ID } from '@angular/core';
import { CitizenWithCPF } from '../cpf-overview.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CpfDocumentContentComponent } from '../cpf-document-content/cpf-document-content.component';
import { CPFDocument } from '../../../../../types/cpf-document.model'; // Import CPFDocument
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// We'll dynamically import html2pdf only in browser environment

@Component({
  selector: 'app-cpf-generated-overview',
  standalone: true,
  imports: [CommonModule, CpfDocumentContentComponent, MatIconModule, MatButtonModule],
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

  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  constructor() {
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
        logo: '/assets/images/logo.png', // Placeholder logo path
        documentTitle: 'CERTIFICAT DE PERSONNE PHYSIQUE',
        documentId: 'DOC-2023-123456', // Placeholder ID
        generationDate: new Date()
      },
      personalInfo: {
        fullName: citizen.fullName.toUpperCase(),
        photo: citizen.profileImage, // Assuming profileImage is the photo path
        identityNumber: citizen.identityNumber,
        birthDate: new Date('1985-01-10'), // Placeholder birth date
        nationality: 'BRÉSILIENNE' // Placeholder nationality
      },
      cpfInfo: {
        number: citizen.cpf.number,
        issueDate: citizen.cpf.issueDate,
        expiryDate: citizen.cpf.expiryDate,
        status: citizen.cpf.status.toUpperCase(),
        qrCode: '/assets/images/qr-code.png' // Placeholder QR code path
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
      console.warn('Export aborted: Document data missing');
      return;
    }

    // Get the HTML element of the document content component
    const documentElement = this.documentContent?.elementRef?.nativeElement;

    if (!documentElement) {
      console.error('Document content element not found.');
      return;
    }

    try {
      // Dynamically import html2pdf only in browser environment
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      // Use html2pdf to generate and download the PDF
      html2pdf(documentElement, {
        margin: 10,
        filename: 'cpf_document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      });

      console.log('Generating and downloading CPF document PDF.');
    } catch (error) {
      console.error('Error loading html2pdf library:', error);
    }
  }
}
