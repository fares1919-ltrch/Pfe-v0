import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  biometricData: {
    height: number;
    weight: number;
    eyeColor: string;
    hairColor: string;
    fingerprint: string;
    photo: string;
  };
  documents: {
    idNumber: string;
    passportNumber?: string;
    drivingLicense?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
  };
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
    MatProgressSpinnerModule
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
  activeTab: 'personal' | 'biometric' | 'documents' | 'contact' = 'personal';
  placeholderCitizen: Citizen = {
    id: '',
    firstName: 'Loading',
    lastName: '...',
    dateOfBirth: new Date(),
    gender: '',
    address: '',
    biometricData: {
      height: 0,
      weight: 0,
      eyeColor: '',
      hairColor: '',
      fingerprint: '',
      photo: 'assets/images/profile-placeholder.jpg'
    },
    documents: {
      idNumber: '',
      passportNumber: '',
      drivingLicense: ''
    },
    contactInfo: {
      email: '',
      phone: ''
    }
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
      this.citizens = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'Male',
          address: '123 Main St',
          biometricData: {
            height: 180,
            weight: 75,
            eyeColor: 'Brown',
            hairColor: 'Black',
            fingerprint: 'base64_encoded_fingerprint',
            photo: 'assets/images/profile-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID123456',
            passportNumber: 'P789012',
            drivingLicense: 'DL345678'
          },
          contactInfo: {
            email: 'john.doe@example.com',
            phone: '+1234567890'
          }
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Smith',
          dateOfBirth: new Date('1985-05-15'),
          gender: 'Female',
          address: '456 Oak Avenue',
          biometricData: {
            height: 165,
            weight: 58,
            eyeColor: 'Blue',
            hairColor: 'Blonde',
            fingerprint: 'base64_encoded_fingerprint_2',
            photo: 'assets/images/profile-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID789012',
            passportNumber: 'P345678',
            drivingLicense: 'DL901234'
          },
          contactInfo: {
            email: 'sarah.smith@example.com',
            phone: '+1987654321'
          }
        },
        {
          id: '3',
          firstName: 'Mohammed',
          lastName: 'Ali',
          dateOfBirth: new Date('1992-08-20'),
          gender: 'Male',
          address: '789 Pine Street',
          biometricData: {
            height: 175,
            weight: 70,
            eyeColor: 'Brown',
            hairColor: 'Brown',
            fingerprint: 'base64_encoded_fingerprint_3',
            photo: 'assets/images/profile-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID345678',
            passportNumber: 'P901234',
            drivingLicense: 'DL567890'
          },
          contactInfo: {
            email: 'mohammed.ali@example.com',
            phone: '+1122334455'
          }
        },
        {
          id: '4',
          firstName: 'Maria',
          lastName: 'Garcia',
          dateOfBirth: new Date('1988-12-10'),
          gender: 'Female',
          address: '321 Elm Road',
          biometricData: {
            height: 160,
            weight: 55,
            eyeColor: 'Green',
            hairColor: 'Brown',
            fingerprint: 'base64_encoded_fingerprint_4',
            photo: 'assets/images/profile-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID901234',
            passportNumber: 'P567890',
            drivingLicense: 'DL123456'
          },
          contactInfo: {
            email: 'maria.garcia@example.com',
            phone: '+1555666777'
          }
        },
        {
          id: '5',
          firstName: 'James',
          lastName: 'Wilson',
          dateOfBirth: new Date('1995-03-25'),
          gender: 'Male',
          address: '654 Maple Drive',
          biometricData: {
            height: 185,
            weight: 80,
            eyeColor: 'Blue',
            hairColor: 'Black',
            fingerprint: 'base64_encoded_fingerprint_5',
            photo: 'assets/images/profile-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID567890',
            passportNumber: 'P123456',
            drivingLicense: 'DL789012'
          },
          contactInfo: {
            email: 'james.wilson@example.com',
            phone: '+1888999000'
          }
        },
        {
          id: '6',
          firstName: 'Emma',
          lastName: 'Thompson',
          dateOfBirth: new Date('1991-07-30'),
          gender: 'Female',
          address: '987 Cedar Lane',
          biometricData: {
            height: 170,
            weight: 62,
            eyeColor: 'Hazel',
            hairColor: 'Red',
            fingerprint: 'base64_encoded_fingerprint_6',
            photo: 'assets/images/profile-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID234567',
            passportNumber: 'P890123',
            drivingLicense: 'DL456789'
          },
          contactInfo: {
            email: 'emma.thompson@example.com',
            phone: '+1777888999'
          }
        },
        {
          id: '7',
          firstName: 'David',
          lastName: 'Chen',
          dateOfBirth: new Date('1987-11-05'),
          gender: 'Male',
          address: '147 Birch Street',
          biometricData: {
            height: 178,
            weight: 72,
            eyeColor: 'Brown',
            hairColor: 'Black',
            fingerprint: 'base64_encoded_fingerprint_7',
            photo: 'assets/images/profile-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID890123',
            passportNumber: 'P456789',
            drivingLicense: 'DL234567'
          },
          contactInfo: {
            email: 'david.chen@example.com',
            phone: '+1666777888'
          }
        },
        {
          id: '8',
          firstName: 'Sophia',
          lastName: 'Martinez',
          dateOfBirth: new Date('1993-09-15'),
          gender: 'Female',
          address: '258 Willow Way',
          biometricData: {
            height: 163,
            weight: 57,
            eyeColor: 'Brown',
            hairColor: 'Black',
            fingerprint: 'base64_encoded_fingerprint_8',
            photo: 'assets/images/profile-placeholder.jpg'
          },
          documents: {
            idNumber: 'ID456789',
            passportNumber: 'P234567',
            drivingLicense: 'DL890123'
          },
          contactInfo: {
            email: 'sophia.martinez@example.com',
            phone: '+1444555666'
          }
        }
      ];
      this.filteredCitizens = [...this.citizens];
      this.isLoading = false;
    }, 2000);
  }

  onSearch() {
    if (!this.searchTerm) {
      this.filteredCitizens = [...this.citizens];
      return;
    }
    
    const searchLower = this.searchTerm.toLowerCase();
    this.filteredCitizens = this.citizens.filter(citizen => 
      citizen.firstName.toLowerCase().includes(searchLower) ||
      citizen.lastName.toLowerCase().includes(searchLower) ||
      citizen.documents.idNumber.toLowerCase().includes(searchLower)
    );
  }

  selectCitizen(citizen: Citizen) {
    this.selectedCitizen = citizen;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }
}
