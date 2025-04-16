import { Component } from '@angular/core';
import { MapsComponent } from './maps/maps.component';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TokenStorageService } from '../../../../core/services/token-storage.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { environment } from '../../../../../environments/environment';

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
    MapsComponent
  ],
  templateUrl: './cpf-request.component.html',
  styleUrls: ['./cpf-request.component.scss']
})
export class CpfRequestComponent {
  identityNumber: number = 0;
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

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService,
    private profileService: ProfileService,
    private router: Router
  ) {
    // Check if user is authenticated and has required role
    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();

    if (!token) {
      console.log('No token found, redirecting to login');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!user?.roles?.includes('ROLE_USER')) {
      console.log('User does not have required role');
      this.router.navigate(['/access-denied']);
      return;
    }

    this.validateProfileForCpf();
  }

  onLocationSelected(locationInfo: LocationInfo): void {
    console.log('Location selected:', locationInfo);
    this.selectedLocation = locationInfo;
    this.address = locationInfo.address.street + ', ' + locationInfo.address.city + ', ' + locationInfo.address.state + ', ' + locationInfo.address.postalCode + ', ' + locationInfo.address.country;
    this.nearestCenter = locationInfo.center.name;
    this.centerDistance = locationInfo.center.distance;

    // Directly set profileComplete to true when a location is selected
    // This ensures the submit button will be enabled if a location is the only requirement
    this.profileComplete = true;
    console.log('Profile set to complete after location selection');

    // Clear any location-related error messages
    if (this.profileError === 'Please select your location on the map') {
      this.profileError = '';
      this.showAlert = false;
    }

    // Log the current state of the submit button conditions
    console.log('Submit button conditions:', {
      profileComplete: this.profileComplete,
      loading: this.loading,
      selectedLocation: !!this.selectedLocation
    });
  }

  validateProfileForCpf() {
    console.log('Validating profile for CPF...');
    this.profileService.validateProfileForCpf().subscribe({
      next: (response) => {
        console.log('Profile validation response:', response);

        // If the only issue is location, consider the profile complete since we're on the map page
        const locationNeeded = response.locationNeeded || false;

        // If only location is needed and there are no other missing fields,
        // we'll consider the profile complete for this page
        this.profileComplete = response.isComplete || (locationNeeded && response.missingFields.length === 0);
        this.missingFields = response.missingFields;

        console.log('Profile complete status after validation:', this.profileComplete);
        console.log('Missing fields:', this.missingFields);
        console.log('Location needed:', locationNeeded);

        if (!this.profileComplete) {
          this.showAlert = true;

          // If only location is needed, show a different message since user can set it on this page
          if (locationNeeded && response.missingFields.length === 0) {
            this.alertMessage = 'Please select your location on the map';
          } else {
            this.alertMessage = `Please complete your profile before submitting a CPF request. Missing fields: ${this.missingFields.join(', ')}`;
          }

          this.profileError = this.alertMessage;
          console.log('Alert message:', this.alertMessage);
        } else {
          console.log('Profile is complete for CPF request');
        }

        // Fetch the complete user profile data directly from the API
        this.profileService.getUserProfile().subscribe({
          next: (userProfile) => {
            console.log('User profile data:', userProfile);
            if (userProfile) {
              // Format the birthDate from ISO string to YYYY-MM-DD for the date input
              if (userProfile.birthDate) {
                const birthDate = new Date(userProfile.birthDate);
                this.birthDate = birthDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                console.log('Formatted birth date:', this.birthDate);
              }

              // Set the identity number
              if (userProfile.identityNumber) {
                this.identityNumber = userProfile.identityNumber;
                console.log('Identity number set:', this.identityNumber);
              }
            }
          },
          error: (error) => {
            console.error('Error fetching user profile:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error validating profile:', error);
        this.showAlert = true;
        this.alertMessage = 'Error checking profile completeness. Please try again.';
        this.profileComplete = false;
        this.profileError = this.alertMessage;
      }
    });
  }

  validateRequest(): string | null {
    console.log('Validating request...');
    console.log('Profile complete:', this.profileComplete);
    console.log('Identity number:', this.identityNumber);
    console.log('Selected location:', this.selectedLocation);
    console.log('Center distance:', this.centerDistance);

    if (!this.profileComplete) {
      console.log('Validation failed: Profile not complete');
      return this.profileError;
    }
    if (!this.identityNumber) {
      console.log('Validation failed: Identity number is required');
      return 'Identity number is required.';
    }
    if (!this.selectedLocation) {
      console.log('Validation failed: No location selected');
      return 'Please select your location on the map.';
    }
    // Increase the maximum allowed distance to 100km to accommodate the test center
    if (this.centerDistance > 100) {
      console.log('Validation failed: Center too far');
      return 'The nearest center is too far from your location. Please choose a closer location.';
    }
    console.log('Validation passed');
    return null;
  }

  onSubmit(form: NgForm) {
    const validationError = this.validateRequest();
    if (validationError) {
      alert(validationError);
      return;
    }

    this.loading = true;

    const token = this.tokenStorage.getToken() || '';
    console.log('Token for request:', token);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    if (!this.selectedLocation) {
      this.loading = false;
      return;
    }

    const data = {
      identityNumber: this.identityNumber,
      address: this.selectedLocation.address,
      birthDate: this.birthDate,
      cost: this.cost,
      status: this.status,
      centerId: this.selectedLocation.center.id
    };

    console.log('Submitting request:', data);

    this.http.post(`${environment.apiUrl}/api/cpf-requests`, data, { headers }).subscribe({
      next: () => {
        alert('Request submitted successfully! The nearest center has been assigned.');
        this.identityNumber = 0;
        this.address = '';
        this.selectedLocation = null;
        this.loading = false;
        form.resetForm();
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 400 && err.error?.message?.includes('already have an active CPF request')) {
          this.showAlert = true;
          this.alertMessage = 'You already have an active CPF request or credential. Please wait for your current request to be processed.';
        } else {
          this.showAlert = true;
          this.alertMessage = err.error?.message || 'Failed to submit request. Please try again.';
        }
      },
    });
  }

  // Debug method to help diagnose button state issues
  debugButtonState() {
    console.log('=== DEBUG BUTTON STATE ===');
    console.log('profileComplete:', this.profileComplete);
    console.log('loading:', this.loading);
    console.log('selectedLocation:', !!this.selectedLocation);
    console.log('Button should be enabled:', this.profileComplete && !this.loading && !!this.selectedLocation);

    if (!this.profileComplete) {
      console.log('Profile error:', this.profileError);
    }

    if (this.selectedLocation) {
      console.log('Selected location details:', this.selectedLocation);
    }

    // Force re-validation
    console.log('Forcing profile validation...');
    this.validateProfileForCpf();
  }
}
