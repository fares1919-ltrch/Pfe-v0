import { Component, Input, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CPFDocument } from '../../../../../types/cpf-document.model';

@Component({
  selector: 'app-cpf-document-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cpf-document-content.component.html',
  styleUrls: ['./cpf-document-content.component.scss']
})
export class CpfDocumentContentComponent implements OnInit {
  @Input() documentData: CPFDocument | undefined;

  // Document images
  governmentSeal: string = 'assets/images/coat of arms.jpg';
  ministryLogo: string = 'assets/images/ministry-of-culture-ministry-of-education-federal-government-of-brazil-brazil-logo.jpg';
  citizenPhoto: string = 'assets/images/person face.jpg';
  qrCodeImage: string = 'assets/images/qr code.png';
  fallbackImage: string = 'assets/images/134766992.png';

  // Current date for document generation
  currentDate: Date = new Date();

  constructor(public elementRef: ElementRef) { }

  ngOnInit(): void {
    // Ensure we have default data if none provided
    if (!this.documentData) {
      this.generateDefaultDocument();
    }
  }

  generateDefaultDocument(): void {
    this.documentData = {
      header: {
        logo: this.governmentSeal,
        documentTitle: 'CERTIFICAT DE PERSONNE PHYSIQUE (CPF)',
        documentId: `CPF-${Date.now()}`,
        generationDate: this.currentDate
      },
      personalInfo: {
        fullName: 'JOÃO SILVA SANTOS',
        photo: this.citizenPhoto,
        identityNumber: '123.456.789-00',
        birthDate: new Date('1985-03-15'),
        nationality: 'BRÉSILIENNE'
      },
      cpfInfo: {
        number: '123.456.789-00',
        issueDate: new Date('2023-05-15'),
        expiryDate: new Date('2033-05-15'),
        status: 'ACTIF',
        qrCode: this.qrCodeImage
      },
      collectionInfo: {
        appointmentDate: new Date('2023-05-10'),
        appointmentLocation: 'Centre de Service CPF - Rio de Janeiro',
        officerName: 'Maria Oliveira Santos',
        officerBadge: 'OFF-2023-001'
      },
      biometricInfo: {
        collectionDate: new Date('2023-05-10'),
        verificationDate: new Date('2023-05-12'),
        collectedTypes: ['Empreintes digitales', 'Reconnaissance faciale', 'Scan de l\'iris']
      },
      footer: {
        legalText: 'Ce document est officiel et légalement reconnu par la République Fédérative du Brésil. Toute falsification constitue un crime selon l\'article 297 du Code Pénal Brésilien.',
        verificationUrl: 'https://cpf.receita.fazenda.gov.br/verificar',
        contactInfo: 'Service Client: 0800-729-0922 | cpf@receita.fazenda.gov.br'
      }
    };
  }

  generateQRCodePlaceholder(): string {
    // Generate a simple QR code placeholder
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="white" stroke="black" stroke-width="2"/>
        <rect x="10" y="10" width="10" height="10" fill="black"/>
        <rect x="30" y="10" width="10" height="10" fill="black"/>
        <rect x="50" y="10" width="10" height="10" fill="black"/>
        <rect x="70" y="10" width="10" height="10" fill="black"/>
        <rect x="10" y="30" width="10" height="10" fill="black"/>
        <rect x="50" y="30" width="10" height="10" fill="black"/>
        <rect x="10" y="50" width="10" height="10" fill="black"/>
        <rect x="30" y="50" width="10" height="10" fill="black"/>
        <rect x="70" y="50" width="10" height="10" fill="black"/>
        <rect x="10" y="70" width="10" height="10" fill="black"/>
        <rect x="30" y="70" width="10" height="10" fill="black"/>
        <rect x="50" y="70" width="10" height="10" fill="black"/>
        <rect x="70" y="70" width="10" height="10" fill="black"/>
        <text x="50" y="95" text-anchor="middle" font-size="8" fill="black">CPF QR</text>
      </svg>
    `);
  }

  formatCPF(cpf: string): string {
    // Format CPF number with proper spacing
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  getDocumentAge(): number {
    if (!this.documentData?.cpfInfo?.issueDate) return 0;
    const issueDate = new Date(this.documentData.cpfInfo.issueDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - issueDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
  }
}
