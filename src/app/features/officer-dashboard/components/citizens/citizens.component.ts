import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  nationality: string;
  maritalStatus?: string;
  profession?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  status: 'active' | 'suspended' | 'blocked';
  cpfStatus: 'generated' | 'pending' | 'failed' | 'fraudulent';
  cpfNumber?: string;
  cpfIssueDate?: Date;
  cpfExpiryDate?: Date;
  deduplicationStatus?: 'verified' | 'in_progress' | 'not_started' | 'duplicate_found';
  assignedOfficer?: string;
  processingCenter?: string;
  biometricData: {
    height: number;
    weight: number;
    eyeColor: string;
    hairColor: string;
    fingerprint: string;
    photo: string;
    signature: string;
    fingerprintsStatus?: string;
    irisStatus?: string;
    faceStatus?: string;
    collectionDate?: Date;
    qualityScore?: string;
  };
  documents: {
    idNumber: string;
    idType: string;
    idIssueDate: Date;
    idExpiryDate: Date;
    passportNumber?: string;
    passportIssueDate?: Date;
    passportExpiryDate?: Date;
    drivingLicense?: string;
    drivingLicenseIssueDate?: Date;
    drivingLicenseExpiryDate?: Date;
    driverLicense?: string;
    birthCertificate?: string;
    status?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  registrationDate: Date;
  lastUpdated: Date;
  notes?: string;
}

@Component({
  selector: 'app-citizens',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './citizens.component.html',
  styleUrl: './citizens.component.css'
})
export class CitizensComponent implements OnInit {
  citizens: Citizen[] = [];
  filteredCitizens: Citizen[] = [];
  searchTerm: string = '';
  selectedCitizen: Citizen | null = null;
  isLoading: boolean = true;
  viewMode: 'grid' | 'list' = 'grid';
  activeTab: 'personal' | 'biometric' | 'documents' | 'contact' | 'status' = 'personal';
  showCpfNumber: boolean = false;

  // Filter states
  cpfStatusFilter: 'all' | 'generated' | 'pending' | 'failed' | 'fraudulent' = 'all';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  // Statistics
  totalCitizens: number = 0;
  activeCitizens: number = 0;
  suspendedCitizens: number = 0;
  blockedCitizens: number = 0;
  generatedCpf: number = 0;
  pendingCpf: number = 0;
  failedCpf: number = 0;
  fraudulentCpf: number = 0;

  placeholderCitizen: Citizen = {
    id: '',
    firstName: 'Loading',
    lastName: '...',
    dateOfBirth: new Date(),
    gender: '',
    nationality: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    status: 'active',
    cpfStatus: 'pending',
    biometricData: {
      height: 0,
      weight: 0,
      eyeColor: '',
      hairColor: '',
      fingerprint: '',
      photo: 'assets/images/profile-placeholder.jpg',
      signature: ''
    },
    documents: {
      idNumber: '',
      idType: '',
      idIssueDate: new Date(),
      idExpiryDate: new Date(),
      passportNumber: '',
      passportIssueDate: new Date(),
      passportExpiryDate: new Date(),
      drivingLicense: '',
      drivingLicenseIssueDate: new Date(),
      drivingLicenseExpiryDate: new Date()
    },
    contactInfo: {
      email: '',
      phone: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      }
    },
    registrationDate: new Date(),
    lastUpdated: new Date()
  };

  ngOnInit() {
    this.loadCitizens();
  }

  loadCitizens() {
    this.isLoading = true;
    // Show placeholder data immediately
    this.citizens = Array(8).fill(this.placeholderCitizen);
    this.filteredCitizens = [...this.citizens];

    // Simulate API call
    setTimeout(() => {
      // Enhanced realistic fake data with diverse scenarios
      this.citizens = [
        {
          id: '1',
          firstName: 'João',
          lastName: 'Silva Santos',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'Male',
          nationality: 'Brazilian',
          maritalStatus: 'Married',
          profession: 'Software Engineer',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01310-200',
          address: {
            street: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            postalCode: '01310-200',
            country: 'Brazil'
          },
          status: 'active',
          cpfStatus: 'generated',
          cpfNumber: '123.456.789-00',
          cpfIssueDate: new Date('2020-01-15'),
          cpfExpiryDate: new Date('2030-01-15'),
          biometricData: {
            height: 180,
            weight: 75,
            eyeColor: 'Brown',
            hairColor: 'Black',
            fingerprint: 'base64...',
            photo: 'assets/images/person face.jpg',
            signature: 'assets/images/signature-placeholder.jpg',
            fingerprintsStatus: 'verified',
            irisStatus: 'verified',
            faceStatus: 'verified',
            collectionDate: new Date('2020-01-12'),
            qualityScore: '98%'
          },
          documents: {
            idNumber: 'RG12345678',
            idType: 'RG',
            idIssueDate: new Date('2015-06-20'),
            idExpiryDate: new Date('2025-06-20'),
            passportNumber: 'BR123456',
            passportIssueDate: new Date('2018-03-10'),
            passportExpiryDate: new Date('2028-03-10'),
            drivingLicense: 'CNH987654321',
            driverLicense: 'CNH987654321',
            birthCertificate: 'BC-SP-1990-05-15-001234',
            status: 'verified'
          },
          contactInfo: {
            email: 'joao.silva@gmail.com',
            phone: '+55 11 98765-4321',
            emergencyContact: {
              name: 'Maria Silva Santos',
              relationship: 'Spouse',
              phone: '+55 11 98765-4322'
            }
          },
          registrationDate: new Date('2020-01-10'),
          lastUpdated: new Date('2023-12-15'),
          deduplicationStatus: 'verified',
          assignedOfficer: 'Officer Maria Oliveira',
          processingCenter: 'Centro São Paulo - SP'
        },
        {
          id: '2',
          firstName: 'Maria',
          lastName: 'Fernanda Costa',
          dateOfBirth: new Date('1985-08-22'),
          gender: 'Female',
          nationality: 'Brazilian',
          maritalStatus: 'Single',
          profession: 'Marketing Manager',
          city: 'Rio de Janeiro',
          state: 'RJ',
          postalCode: '20040-020',
          address: {
            street: 'Av. Copacabana, 456',
            city: 'Rio de Janeiro',
            state: 'RJ',
            postalCode: '20040-020',
            country: 'Brazil'
          },
          status: 'active',
          cpfStatus: 'pending',
          biometricData: {
            height: 165,
            weight: 60,
            eyeColor: 'Green',
            hairColor: 'Brown',
            fingerprint: 'base64...',
            photo: 'assets/images/person face.jpg',
            signature: 'assets/images/signature-placeholder.jpg',
            fingerprintsStatus: 'pending',
            irisStatus: 'verified',
            faceStatus: 'verified',
            collectionDate: new Date('2023-11-22'),
            qualityScore: '92%'
          },
          documents: {
            idNumber: 'RG87654321',
            idType: 'RG',
            idIssueDate: new Date('2016-09-15'),
            idExpiryDate: new Date('2026-09-15'),
            passportNumber: 'BR789012',
            passportIssueDate: new Date('2019-04-10'),
            passportExpiryDate: new Date('2029-04-10'),
            drivingLicense: 'CNH456789123',
            driverLicense: 'CNH456789123',
            birthCertificate: 'BC-RJ-1985-08-22-005678',
            status: 'pending'
          },
          contactInfo: {
            email: 'maria.costa@outlook.com',
            phone: '+55 21 98765-4323',
            emergencyContact: {
              name: 'Carlos Costa',
              relationship: 'Father',
              phone: '+55 21 98765-4324'
            }
          },
          registrationDate: new Date('2023-11-20'),
          lastUpdated: new Date('2023-12-10'),
          deduplicationStatus: 'in_progress',
          assignedOfficer: 'Officer Carlos Mendes',
          processingCenter: 'Centro Rio de Janeiro - RJ'
        },
        {
          id: '3',
          firstName: 'Carlos',
          lastName: 'Eduardo Santos',
          dateOfBirth: new Date('1978-03-30'),
          gender: 'Male',
          nationality: 'Brazilian',
          maritalStatus: 'Divorced',
          profession: 'Construction Worker',
          city: 'Belo Horizonte',
          state: 'MG',
          postalCode: '30130-110',
          address: {
            street: 'Rua da Liberdade, 789',
            city: 'Belo Horizonte',
            state: 'MG',
            postalCode: '30130-110',
            country: 'Brazil'
          },
          status: 'suspended',
          cpfStatus: 'fraudulent',
          biometricData: {
            height: 175,
            weight: 80,
            eyeColor: 'Brown',
            hairColor: 'Black',
            fingerprint: 'base64...',
            photo: 'assets/images/person face.jpg',
            signature: 'assets/images/signature-placeholder.jpg',
            fingerprintsStatus: 'failed',
            irisStatus: 'failed',
            faceStatus: 'suspicious',
            collectionDate: new Date('2023-10-17'),
            qualityScore: '67%'
          },
          documents: {
            idNumber: 'RG34567890',
            idType: 'RG',
            idIssueDate: new Date('2014-12-05'),
            idExpiryDate: new Date('2024-12-05'),
            passportNumber: 'BR345678',
            passportIssueDate: new Date('2015-01-10'),
            passportExpiryDate: new Date('2025-01-10'),
            drivingLicense: 'CNH123456789',
            driverLicense: 'CNH123456789',
            birthCertificate: 'BC-MG-1978-03-30-009876',
            status: 'suspicious'
          },
          contactInfo: {
            email: 'carlos.santos@yahoo.com',
            phone: '+55 31 98765-4324',
            emergencyContact: {
              name: 'Ana Santos',
              relationship: 'Sister',
              phone: '+55 31 98765-4325'
            }
          },
          registrationDate: new Date('2023-10-15'),
          lastUpdated: new Date('2023-12-05'),
          notes: 'Account suspended due to document verification issues',
          deduplicationStatus: 'duplicate_found',
          assignedOfficer: 'Officer Ana Rodrigues',
          processingCenter: 'Centro Belo Horizonte - MG'
        },
        {
          id: '4',
          firstName: 'Ana',
          lastName: 'Paula Oliveira',
          dateOfBirth: new Date('1995-11-12'),
          gender: 'Female',
          nationality: 'Brazilian',
          address: {
            street: 'Rua do Pelourinho, 321',
            city: 'Salvador',
            state: 'BA',
            postalCode: '40015-970',
            country: 'Brazil'
          },
          status: 'blocked',
          cpfStatus: 'generated',
          cpfNumber: '987.654.321-00',
          cpfIssueDate: new Date('2019-07-20'),
          cpfExpiryDate: new Date('2029-07-20'),
          biometricData: {
            height: 170,
            weight: 65,
            eyeColor: 'Blue',
            hairColor: 'Blonde',
            fingerprint: 'base64...',
            photo: 'assets/images/person face.jpg',
            signature: 'assets/images/signature-placeholder.jpg'
          },
          documents: {
            idNumber: 'RG90123456',
            idType: 'RG',
            idIssueDate: new Date('2017-04-18'),
            idExpiryDate: new Date('2027-04-18'),
            passportNumber: 'BR345678',
            drivingLicense: 'CNH456789123'
          },
          contactInfo: {
            email: 'ana.oliveira@hotmail.com',
            phone: '+55 71 98765-4325',
            emergencyContact: {
              name: 'Pedro Oliveira',
              relationship: 'Brother',
              phone: '+55 71 98765-4326'
            }
          },
          registrationDate: new Date('2019-07-15'),
          lastUpdated: new Date('2023-11-30'),
          notes: 'Account blocked due to suspicious activity',
          deduplicationStatus: 'verified',
          assignedOfficer: 'Officer João Silva',
          processingCenter: 'Centro Salvador - BA'
        },
        {
          id: '5',
          firstName: 'Pedro',
          lastName: 'Henrique Costa',
          dateOfBirth: new Date('1982-06-25'),
          gender: 'Male',
          nationality: 'Brazilian',
          address: {
            street: 'SQN 308, Bloco A',
            city: 'Brasília',
            state: 'DF',
            postalCode: '70070-900',
            country: 'Brazil'
          },
          status: 'active',
          cpfStatus: 'generated',
          cpfNumber: '456.789.123-00',
          cpfIssueDate: new Date('2021-02-28'),
          cpfExpiryDate: new Date('2031-02-28'),
          biometricData: {
            height: 182,
            weight: 78,
            eyeColor: 'Brown',
            hairColor: 'Black',
            fingerprint: 'base64...',
            photo: 'assets/images/person face.jpg',
            signature: 'assets/images/signature-placeholder.jpg'
          },
          documents: {
            idNumber: 'RG56789012',
            idType: 'RG',
            idIssueDate: new Date('2018-11-10'),
            idExpiryDate: new Date('2028-11-10'),
            passportNumber: 'BR901234',
            drivingLicense: 'CNH789012345'
          },
          contactInfo: {
            email: 'pedro.costa@gmail.com',
            phone: '+55 61 98765-4326',
            emergencyContact: {
              name: 'Lucia Costa',
              relationship: 'Mother',
              phone: '+55 61 98765-4327'
            }
          },
          registrationDate: new Date('2021-02-20'),
          lastUpdated: new Date('2023-12-01'),
          deduplicationStatus: 'verified',
          assignedOfficer: 'Officer Lucia Fernandes',
          processingCenter: 'Centro Brasília - DF'
        },
        {
          id: '6',
          firstName: 'Fernanda',
          lastName: 'Alves Pereira',
          dateOfBirth: new Date('1993-09-18'),
          gender: 'Female',
          nationality: 'Brazilian',
          address: {
            street: 'Rua Augusta, 1500',
            city: 'São Paulo',
            state: 'SP',
            postalCode: '01305-100',
            country: 'Brazil'
          },
          status: 'active',
          cpfStatus: 'pending',
          biometricData: {
            height: 168,
            weight: 58,
            eyeColor: 'Brown',
            hairColor: 'Brown',
            fingerprint: 'base64...',
            photo: 'assets/images/person face.jpg',
            signature: 'assets/images/signature-placeholder.jpg'
          },
          documents: {
            idNumber: 'RG11223344',
            idType: 'RG',
            idIssueDate: new Date('2019-03-22'),
            idExpiryDate: new Date('2029-03-22'),
            passportNumber: 'BR556677'
          },
          contactInfo: {
            email: 'fernanda.pereira@uol.com.br',
            phone: '+55 11 99876-5432',
            emergencyContact: {
              name: 'Roberto Pereira',
              relationship: 'Father',
              phone: '+55 11 99876-5433'
            }
          },
          registrationDate: new Date('2023-12-01'),
          lastUpdated: new Date('2023-12-18'),
          deduplicationStatus: 'not_started',
          assignedOfficer: 'Officer Roberto Silva',
          processingCenter: 'Centro São Paulo - SP'
        },
        {
          id: '7',
          firstName: 'Ricardo',
          lastName: 'Moreira Lima',
          dateOfBirth: new Date('1987-12-03'),
          gender: 'Male',
          nationality: 'Brazilian',
          address: {
            street: 'Av. Boa Viagem, 2000',
            city: 'Recife',
            state: 'PE',
            postalCode: '51020-000',
            country: 'Brazil'
          },
          status: 'suspended',
          cpfStatus: 'pending',
          biometricData: {
            height: 177,
            weight: 72,
            eyeColor: 'Green',
            hairColor: 'Brown',
            fingerprint: 'base64...',
            photo: 'assets/images/person face.jpg',
            signature: 'assets/images/signature-placeholder.jpg'
          },
          documents: {
            idNumber: 'RG55667788',
            idType: 'RG',
            idIssueDate: new Date('2020-08-15'),
            idExpiryDate: new Date('2030-08-15'),
            drivingLicense: 'CNH998877665'
          },
          contactInfo: {
            email: 'ricardo.lima@terra.com.br',
            phone: '+55 81 98765-4327',
            emergencyContact: {
              name: 'Carla Lima',
              relationship: 'Wife',
              phone: '+55 81 98765-4328'
            }
          },
          registrationDate: new Date('2023-11-15'),
          lastUpdated: new Date('2023-12-12'),
          notes: 'Pending document review',
          deduplicationStatus: 'in_progress',
          assignedOfficer: 'Officer Carla Santos',
          processingCenter: 'Centro Recife - PE'
        },
        {
          id: '8',
          firstName: 'Juliana',
          lastName: 'Rodrigues Souza',
          dateOfBirth: new Date('1991-04-07'),
          gender: 'Female',
          nationality: 'Brazilian',
          address: {
            street: 'Rua XV de Novembro, 800',
            city: 'Curitiba',
            state: 'PR',
            postalCode: '80020-310',
            country: 'Brazil'
          },
          status: 'active',
          cpfStatus: 'generated',
          cpfNumber: '321.654.987-00',
          cpfIssueDate: new Date('2022-05-10'),
          cpfExpiryDate: new Date('2032-05-10'),
          biometricData: {
            height: 163,
            weight: 55,
            eyeColor: 'Brown',
            hairColor: 'Black',
            fingerprint: 'base64...',
            photo: 'assets/images/person face.jpg',
            signature: 'assets/images/signature-placeholder.jpg'
          },
          documents: {
            idNumber: 'RG99887766',
            idType: 'RG',
            idIssueDate: new Date('2021-01-20'),
            idExpiryDate: new Date('2031-01-20'),
            passportNumber: 'BR112233',
            drivingLicense: 'CNH554433221'
          },
          contactInfo: {
            email: 'juliana.souza@bol.com.br',
            phone: '+55 41 98765-4329',
            emergencyContact: {
              name: 'Marcos Souza',
              relationship: 'Husband',
              phone: '+55 41 98765-4330'
            }
          },
          registrationDate: new Date('2022-05-05'),
          lastUpdated: new Date('2023-12-08'),
          deduplicationStatus: 'verified',
          assignedOfficer: 'Officer Marcos Oliveira',
          processingCenter: 'Centro Curitiba - PR'
        }
      ];

      this.calculateStatistics();
      this.applyFilters();
      this.isLoading = false;
    }, 2000);
  }

  calculateStatistics() {
    this.totalCitizens = this.citizens.length;
    this.activeCitizens = this.citizens.filter(c => c.status === 'active').length;
    this.suspendedCitizens = this.citizens.filter(c => c.status === 'suspended').length;
    this.blockedCitizens = this.citizens.filter(c => c.status === 'blocked').length;
    this.generatedCpf = this.citizens.filter(c => c.cpfStatus === 'generated').length;
    this.pendingCpf = this.citizens.filter(c => c.cpfStatus === 'pending').length;
    this.failedCpf = this.citizens.filter(c => c.cpfStatus === 'failed').length;
    this.fraudulentCpf = this.citizens.filter(c => c.cpfStatus === 'fraudulent').length;
  }

  clearAllFilters() {
    this.searchTerm = '';
    this.cpfStatusFilter = 'all';
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.citizens];

    // Apply search filter (search by citizen ID only)
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(citizen =>
        citizen.documents.idNumber.toLowerCase().includes(searchLower)
      );
    }

    // Apply CPF status filter
    if (this.cpfStatusFilter !== 'all') {
      filtered = filtered.filter(citizen => citizen.cpfStatus === this.cpfStatusFilter);
    }

    this.filteredCitizens = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1; // Reset to first page when filters change
    this.calculateStatistics();
  }

  // Pagination methods
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get paginatedCitizens(): Citizen[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCitizens.slice(startIndex, endIndex);
  }

  get paginationEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  selectCitizen(citizen: Citizen) {
    this.selectedCitizen = citizen;
    this.activeTab = 'personal';
  }

  viewCitizenDetails(citizen: Citizen) {
    this.selectedCitizen = citizen;
    this.activeTab = 'personal';
    this.showCpfNumber = false; // Reset CPF visibility when opening modal
  }

  toggleCpfVisibility() {
    this.showCpfNumber = !this.showCpfNumber;
  }

  exportToExcel() {
    // Implement Excel export functionality
    console.log('Exporting to Excel...');
  }

  editCitizen(citizen: Citizen) {
    // TODO: Implement edit functionality
    console.log('Edit citizen:', citizen);
  }

  generateCPF(citizen: Citizen) {
    // TODO: Implement CPF generation
    console.log('Generate CPF for:', citizen);
  }

  scheduleAppointment(citizen: Citizen) {
    // TODO: Implement appointment scheduling
    console.log('Schedule appointment for:', citizen);
  }

  changeCitizenStatus(citizen: Citizen) {
    // TODO: Implement status change
    console.log('Change status for:', citizen);
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return '#2ecc71';
      case 'suspended': return '#f1c40f';
      case 'blocked': return '#e74c3c';
      default: return '#95a5a6';
    }
  }

  getCpfStatusColor(status: string): string {
    switch (status) {
      case 'generated': return '#2ecc71';
      case 'pending': return '#f1c40f';
      case 'failed': return '#e74c3c';
      default: return '#95a5a6';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getFullAddress(address: Citizen['address']): string {
    return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
  }

  // Additional methods for actions
  viewDocuments(citizen: Citizen): void {
    console.log('View documents for citizen:', citizen);
    // TODO: Implement document viewing
  }

  suspendAccount(citizen: Citizen): void {
    console.log('Suspend account for citizen:', citizen);
    // TODO: Implement account suspension
  }

  blockAccount(citizen: Citizen): void {
    console.log('Block account for citizen:', citizen);
    // TODO: Implement account blocking
  }
}
