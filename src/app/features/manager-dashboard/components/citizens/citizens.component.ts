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

interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  status: 'active' | 'suspended' | 'blocked';
  cpfStatus: 'generated' | 'pending' | 'failed';
  cpfNumber?: string;
  cpfIssueDate?: Date;
  cpfExpiryDate?: Date;
  biometricData: {
    height: number;
    weight: number;
    eyeColor: string;
    hairColor: string;
    fingerprint: string;
    photo: string;
    signature: string;
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
    MatTooltipModule
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
  
  // Filter states
  statusFilter: 'all' | 'active' | 'suspended' | 'blocked' = 'all';
  cpfStatusFilter: 'all' | 'generated' | 'pending' | 'failed' = 'all';
  dateRangeFilter: { start: Date | null; end: Date | null } = { start: null, end: null };

  // Statistics
  totalCitizens: number = 0;
  activeCitizens: number = 0;
  suspendedCitizens: number = 0;
  blockedCitizens: number = 0;
  generatedCpf: number = 0;
  pendingCpf: number = 0;
  failedCpf: number = 0;

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
      // Sample data with diverse states
      this.citizens = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'Male',
          nationality: 'Brazilian',
          address: {
            street: '123 Main St',
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
            photo: 'assets/images/profile-placeholder.jpg',
            signature: 'assets/images/signature-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID123456',
            idType: 'National ID',
            idIssueDate: new Date('2015-06-20'),
            idExpiryDate: new Date('2025-06-20'),
            passportNumber: 'BR123456',
            passportIssueDate: new Date('2018-03-10'),
            passportExpiryDate: new Date('2028-03-10')
          },
          contactInfo: {
            email: 'john.doe@email.com',
            phone: '+55 11 98765-4321',
            emergencyContact: {
              name: 'Jane Doe',
              relationship: 'Spouse',
              phone: '+55 11 98765-4322'
            }
          },
          registrationDate: new Date('2020-01-10'),
          lastUpdated: new Date('2023-12-15')
        },
        {
          id: '2',
          firstName: 'Maria',
          lastName: 'Silva',
          dateOfBirth: new Date('1985-08-22'),
          gender: 'Female',
          nationality: 'Brazilian',
          address: {
            street: '456 Oak Ave',
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
            photo: 'assets/images/profile-placeholder.jpg',
            signature: 'assets/images/signature-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID789012',
            idType: 'National ID',
            idIssueDate: new Date('2016-09-15'),
            idExpiryDate: new Date('2026-09-15')
          },
          contactInfo: {
            email: 'maria.silva@email.com',
            phone: '+55 21 98765-4323'
          },
          registrationDate: new Date('2023-11-20'),
          lastUpdated: new Date('2023-12-10')
        },
        {
          id: '3',
          firstName: 'Carlos',
          lastName: 'Santos',
          dateOfBirth: new Date('1978-03-30'),
          gender: 'Male',
          nationality: 'Brazilian',
          address: {
            street: '789 Pine St',
            city: 'Belo Horizonte',
            state: 'MG',
            postalCode: '30130-110',
            country: 'Brazil'
          },
          status: 'suspended',
          cpfStatus: 'failed',
          biometricData: {
            height: 175,
            weight: 80,
            eyeColor: 'Brown',
            hairColor: 'Black',
            fingerprint: 'base64...',
            photo: 'assets/images/profile-placeholder.jpg',
            signature: 'assets/images/signature-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID345678',
            idType: 'National ID',
            idIssueDate: new Date('2014-12-05'),
            idExpiryDate: new Date('2024-12-05')
          },
          contactInfo: {
            email: 'carlos.santos@email.com',
            phone: '+55 31 98765-4324'
          },
          registrationDate: new Date('2023-10-15'),
          lastUpdated: new Date('2023-12-05'),
          notes: 'Account suspended due to document verification issues'
        },
        {
          id: '4',
          firstName: 'Ana',
          lastName: 'Oliveira',
          dateOfBirth: new Date('1995-11-12'),
          gender: 'Female',
          nationality: 'Brazilian',
          address: {
            street: '321 Maple Dr',
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
            photo: 'assets/images/profile-placeholder.jpg',
            signature: 'assets/images/signature-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID901234',
            idType: 'National ID',
            idIssueDate: new Date('2017-04-18'),
            idExpiryDate: new Date('2027-04-18')
          },
          contactInfo: {
            email: 'ana.oliveira@email.com',
            phone: '+55 71 98765-4325'
          },
          registrationDate: new Date('2019-07-15'),
          lastUpdated: new Date('2023-11-30'),
          notes: 'Account blocked due to suspicious activity'
        },
        {
          id: '5',
          firstName: 'Pedro',
          lastName: 'Costa',
          dateOfBirth: new Date('1982-06-25'),
          gender: 'Male',
          nationality: 'Brazilian',
          address: {
            street: '654 Cedar Ln',
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
            photo: 'assets/images/profile-placeholder.jpg',
            signature: 'assets/images/signature-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID567890',
            idType: 'National ID',
            idIssueDate: new Date('2018-11-10'),
            idExpiryDate: new Date('2028-11-10')
          },
          contactInfo: {
            email: 'pedro.costa@email.com',
            phone: '+55 61 98765-4326'
          },
          registrationDate: new Date('2021-02-20'),
          lastUpdated: new Date('2023-12-01')
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
  }

  clearAllFilters() {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.cpfStatusFilter = 'all';
    this.dateRangeFilter = { start: null, end: null };
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onCpfStatusFilterChange() {
    this.applyFilters();
  }

  onDateRangeChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.citizens];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(citizen => 
        citizen.firstName.toLowerCase().includes(searchLower) ||
        citizen.lastName.toLowerCase().includes(searchLower) ||
        citizen.documents.idNumber.toLowerCase().includes(searchLower) ||
        citizen.cpfNumber?.toLowerCase().includes(searchLower) ||
        citizen.contactInfo.email.toLowerCase().includes(searchLower) ||
        citizen.contactInfo.phone.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(citizen => citizen.status === this.statusFilter);
    }

    // Apply CPF status filter
    if (this.cpfStatusFilter !== 'all') {
      filtered = filtered.filter(citizen => citizen.cpfStatus === this.cpfStatusFilter);
    }

    // Apply date range filter
    if (this.dateRangeFilter.start && this.dateRangeFilter.end) {
      filtered = filtered.filter(citizen => {
        const registrationDate = new Date(citizen.registrationDate);
        return registrationDate >= this.dateRangeFilter.start! && 
               registrationDate <= this.dateRangeFilter.end!;
      });
    }

    this.filteredCitizens = filtered;
    this.calculateStatistics();
  }

  selectCitizen(citizen: Citizen) {
    this.selectedCitizen = citizen;
    this.activeTab = 'personal';
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
}
