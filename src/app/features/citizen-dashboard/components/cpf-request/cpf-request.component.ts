import { Component } from '@angular/core';
import { MapsComponent } from './maps/maps.component';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TokenStorageService } from '../../../../core/services/token-storage.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { environment } from '../../../../../environments/environment';
import { CpfRequestService, CpfRequest } from '../../../../core/services/cpf-request.service';
import { CenterService } from '../../../../core/services/center.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat: number;
  lon: number;
}

interface LocationInfo {
  address: Address;
  center: {
    id: string;
    name: string;
    address: string;
    distance: number;
    coords: [number, number];
  };
  userCoords: {
    lat: number;
    lon: number;
  };
}

@Component({
  selector: 'app-cpf-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MapsComponent,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cpf-request.component.html',
  styleUrls: ['./cpf-request.component.scss']
})
export class CpfRequestComponent {
  identityNumber: string = '';
  address: string = '';
  loading: boolean = false;
  birthDate: string = '';
  cost: string = '7.09 BRL';
  status: string = 'pending';
  profileComplete: boolean = true;
  profileError: string = '';
  showAlert: boolean = false;
  alertMessage: string = '';
  missingFields: string[] = [];
  selectedLocation: LocationInfo | null = null;
  nearestCenter: string = '';
  centerDistance: number = 0;
  userProfile: any = null;

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService,
    private profileService: ProfileService,
    private cpfRequestService: CpfRequestService,
    private centerService: CenterService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.profileService.getUserProfile().subscribe({
      next: (data) => {
        this.userProfile = data;
        this.validateProfileForCpf();
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.profileError = 'Failed to load user profile. Please try again.';
      }
    });
  }

  onLocationSelected(locationInfo: LocationInfo): void {
    this.selectedLocation = locationInfo;
    this.nearestCenter = locationInfo.center.name;
    this.centerDistance = locationInfo.center.distance;

    // Format address for display
    this.address = `${locationInfo.address.street}, ${locationInfo.address.city}, ${locationInfo.address.state} ${locationInfo.address.postalCode}`;
  }

  validateProfileForCpf() {
    if (!this.userProfile) {
      this.profileComplete = false;
      this.profileError = 'User profile not loaded';
      return;
    }

    this.missingFields = [];

    if (!this.userProfile.firstName) this.missingFields.push('First Name');
    if (!this.userProfile.lastName) this.missingFields.push('Last Name');
    if (!this.userProfile.birthDate) this.missingFields.push('Birth Date');
    if (!this.userProfile.identityNumber) this.missingFields.push('Identity Number');

    if (this.missingFields.length > 0) {
      this.profileComplete = false;
      this.profileError = `Please complete your profile with: ${this.missingFields.join(', ')}`;
    } else {
      this.profileComplete = true;
      this.profileError = '';
    }
  }

  validateRequest(): string | null {
    if (!this.identityNumber) {
      return 'Identity number is required';
    }

    if (!this.selectedLocation) {
      return 'Please select a location on the map';
    }

    if (!this.profileComplete) {
      return 'Please complete your profile before submitting a CPF request';
    }

    return null;
  }

  onSubmit(form: NgForm) {
    const error = this.validateRequest();
    if (error) {
      this.showAlert = true;
      this.alertMessage = error;
      return;
    }

    this.loading = true;

    const requestData: Partial<CpfRequest> = {
      identityNumber: this.identityNumber,
      address: this.selectedLocation!.address,
      cost: this.cost,
      status: 'pending',
      centerId: this.selectedLocation!.center.id,
      officerDecision: {
        status: 'pending'
      }
    };

    this.cpfRequestService.createCpfRequest(requestData).subscribe({
      next: (response) => {
        this.loading = false;
        this.showAlert = true;
        this.alertMessage = 'CPF request submitted successfully!';

        // Show success message
        this.snackBar.open('CPF request submitted successfully!', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });

        // Redirect to dashboard after a delay
        setTimeout(() => {
          this.router.navigate(['/citizen/dashboard']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.showAlert = true;

        if (err.error && err.error.message) {
          this.alertMessage = err.error.message;
        } else {
          this.alertMessage = 'Failed to submit CPF request. Please try again.';
        }

        // Show error message
        this.snackBar.open(this.alertMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  debugButtonState() {
    console.log('Form state:', {
      identityNumber: this.identityNumber,
      selectedLocation: this.selectedLocation,
      profileComplete: this.profileComplete,
      profileError: this.profileError,
      userProfile: this.userProfile
    });
  }
}
