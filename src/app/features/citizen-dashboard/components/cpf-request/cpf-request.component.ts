import { Component, Renderer2, ElementRef } from '@angular/core';
import { MapsComponent } from './maps/maps.component';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TokenStorageService } from '../../../../core/services/token-storage.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { environment } from '../../../../../environments/environment';
import { CpfRequestService, CpfRequest } from '../../../../core/services/cpf-request.service';
import { CenterService } from '../../../../core/services/center.service';
import { finalize } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
  alertType: string = 'error'; // Default to error
  private alertTimeout: any;
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
    private router: Router,
    private snackBar: MatSnackBar,
    private renderer: Renderer2,
    private elementRef: ElementRef
  ) {
    this.loadUserProfile();
    this.checkExistingRequest();
  }

  loadUserProfile() {
    this.profileService.getUserProfile().subscribe({
      next: (data) => {
        this.userProfile = data;

        // Format the birth date if it exists
        if (data.birthDate) {
          try {
            const date = new Date(data.birthDate);
            this.birthDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          } catch (e) {
            console.error('Error formatting birth date:', e);
            this.birthDate = '';
          }
        }

        // Set the identity number from the profile
        if (data.identityNumber) {
          this.identityNumber = data.identityNumber.toString();
        }

        console.log('Loaded user profile data:', {
          birthDate: this.birthDate,
          identityNumber: this.identityNumber
        });

        this.validateProfileForCpf();
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.profileError = 'Failed to load user profile. Please try again.';
      }
    });
  }

  onLocationSelected(locationInfo: LocationInfo): void {
    if (!locationInfo) {
      console.warn('Location selection was empty');
      return;
    }

    console.log('Raw location info received:', JSON.stringify(locationInfo));
    this.selectedLocation = locationInfo;

    // Handle case where no center was found but we still have user coordinates
    if (locationInfo.center.id === 'no-center' || !locationInfo.center.name) {
      console.warn('No center with valid coordinates found');
      this.nearestCenter = 'No Available Center';
      this.centerDistance = 0;
    } else {
      this.nearestCenter = locationInfo.center.name;
      this.centerDistance = locationInfo.center.distance;
    }

    // Format address for display
    if (locationInfo.address) {
      this.address = `${locationInfo.address.street || ''}, ${locationInfo.address.city || ''}, ${locationInfo.address.state || ''} ${locationInfo.address.postalCode || ''}`;
    } else {
      this.address = 'Address information not available';
      console.warn('Location selection has no address information');
    }

    console.log('Location selected:', {
      address: this.address,
      center: this.nearestCenter,
      distance: this.centerDistance,
      coordinates: {
        lat: locationInfo.userCoords?.lat,
        lon: locationInfo.userCoords?.lon
      }
    });
  }

  validateProfileForCpf() {
    if (!this.userProfile) {
      this.profileComplete = false;
      this.profileError = 'User profile not loaded';
      console.error('Profile validation failed: User profile not loaded');
      return;
    }

    console.log('Validating profile for CPF:', {
      profileData: {
        firstName: this.userProfile.firstName,
        lastName: this.userProfile.lastName,
        birthDate: this.userProfile.birthDate,
        identityNumber: this.userProfile.identityNumber
      },
      componentData: {
        birthDate: this.birthDate,
        identityNumber: this.identityNumber
      }
    });

    this.missingFields = [];
    // Use component birthDate field which should be populated by loadUserProfile
    if (!this.birthDate) {
      this.missingFields.push('Birth Date');
      // Try to populate birthDate again from profile if it exists
      if (this.userProfile.birthDate) {
        try {
          const date = new Date(this.userProfile.birthDate);
          this.birthDate = date.toISOString().split('T')[0];
          console.log('Re-populated birthDate from profile:', this.birthDate);
          // Remove birthDate from missing fields if it was successfully populated
          const index = this.missingFields.indexOf('Birth Date');
          if (index > -1 && this.birthDate) {
            this.missingFields.splice(index, 1);
          }
        } catch (e) {
          console.error('Error formatting birth date during validation:', e);
        }
      }
    }

    // Use component identityNumber field which should be populated by loadUserProfile
    if (!this.identityNumber) {
      this.missingFields.push('Identity Number');
      // Try to populate identityNumber again from profile if it exists
      if (this.userProfile.identityNumber) {
        this.identityNumber = this.userProfile.identityNumber.toString();
        console.log('Re-populated identityNumber from profile:', this.identityNumber);
        // Remove identityNumber from missing fields if it was successfully populated
        const index = this.missingFields.indexOf('Identity Number');
        if (index > -1 && this.identityNumber) {
          this.missingFields.splice(index, 1);
        }
      }
    }

    if (this.missingFields.length > 0) {
      this.profileComplete = false;
      this.profileError = `Please complete your profile with: ${this.missingFields.join(', ')}`;
      console.warn('Profile incomplete. Missing fields:', this.missingFields);
    } else {
      this.profileComplete = true;
      this.profileError = '';
      console.log('Profile validation passed');
    }
  }

  showAlertMessage(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;

    // Clear any existing timeout
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }

    // Scroll to top
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Focus on the alert for accessibility
      const alertElement = this.elementRef.nativeElement.querySelector('#alert-message');
      if (alertElement) {
        alertElement.focus();
      }
    }, 100);

    // Auto-hide after 7 seconds
    this.alertTimeout = setTimeout(() => {
      this.closeAlert();
    }, 7000);
  }

  closeAlert(): void {
    this.showAlert = false;
    this.alertMessage = '';
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
  }

  validateRequest(): boolean {
    console.log('Validating request before submission');

    // Check if profile is complete
    if (this.missingFields.length > 0) {
      console.error('Profile validation failed: Missing required fields', this.missingFields);
      this.showAlertMessage(`Please complete your profile. Missing fields: ${this.missingFields.join(', ')}`, 'error');
      return false;
    }

    // Check if location is selected
    if (!this.selectedLocation) {
      console.error('Request validation failed: No location selected');
      this.showAlertMessage('Please select a location on the map', 'error');
      return false;
    }

    // Check if we have valid user coordinates (even if no center is available)
    if (!this.selectedLocation.userCoords ||
        !this.selectedLocation.userCoords.lat ||
        !this.selectedLocation.userCoords.lon) {
      console.error('Request validation failed: Missing user coordinates');
      this.showAlertMessage('Location information is incomplete. Please try selecting your location again.', 'error');
      return false;
    }

    console.log('Request validation successful');
    return true;
  }

  onSubmit(): void {
    console.log('Submit button clicked');
    this.loading = true;

    // Validate request before submitting
    if (!this.validateRequest()) {
      this.loading = false;
      return;
    }

    // Additional validation for center ID
    if (!this.selectedLocation?.center?.id) {
      console.error('No center ID available');
      this.showAlertMessage('Please select a valid service center', 'error');
      this.loading = false;
      return;
    }

    console.log('Preparing request data', {
      identityNumber: this.identityNumber,
      location: this.selectedLocation,
      centerId: this.selectedLocation.center.id
    });

    // Prepare request data with complete information
    const requestData = {
      identityNumber: this.identityNumber,
      address: {
        street: this.selectedLocation?.address?.street || '',
        city: this.selectedLocation?.address?.city || '',
        state: this.selectedLocation?.address?.state || '',
        postalCode: this.selectedLocation?.address?.postalCode || '',
        country: this.selectedLocation?.address?.country || '',
        lat: this.selectedLocation?.userCoords?.lat || 0,
        lon: this.selectedLocation?.userCoords?.lon || 0
      },
      centerId: this.selectedLocation.center.id,
      cost: this.cost.split(' ')[0] // Extract numeric value from "7.09 BRL"
    };

    console.log('Submitting CPF request with data:', requestData);

    // Submit request to the service
    this.cpfRequestService.submitCpfRequest(requestData).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (response) => {
        console.log('CPF request submitted successfully', response);
        this.status = 'submitted';
        
        // Show success message with new alert method
        this.showAlertMessage('Request submitted successfully', 'success');

       

        // Navigate to dashboard or confirmation page
        this.router.navigate(['/citizen-dashboard/cpf-request']);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error submitting CPF request', error);
        
        // Provide more specific error messages
        if (error.status === 400) {
          if (error.error?.message?.includes('already exists')) {
            this.showAlertMessage('You already have an existing CPF request', 'error');
          } else if (error.error?.message) {
            this.showAlertMessage(error.error.message, 'error');
          } else {
            this.showAlertMessage('Please check your request details and try again.', 'error');
          }
        } else if (error.status === 401) {
          this.showAlertMessage('Your session has expired. Please log in again.', 'error');
          this.router.navigate(['/auth/login']);
        } else if (error.status === 404) {
          this.showAlertMessage('The selected center is no longer available. Please choose another center.', 'error');
        } else {
          this.showAlertMessage('There was an error submitting your request. Please try again later.', 'error');
        }

       
      }
    });
  }

  debugButtonState() {
    // Check if we have userProfile and print its contents
    console.log('User Profile Data:', this.userProfile ? {
      exists: true,
      firstName: this.userProfile.firstName,
      lastName: this.userProfile.lastName,
      birthDate: this.userProfile.birthDate,
      identityNumber: this.userProfile.identityNumber
    } : 'Not loaded');

    // Check component state variables
    console.log('Component State:', {
      identityNumber: this.identityNumber,
      birthDate: this.birthDate,
      profileComplete: this.profileComplete,
      profileError: this.profileError,
      hasSelectedLocation: !!this.selectedLocation
    });

    // Check selected location details
    if (this.selectedLocation) {
      console.log('Selected Location:', {
        address: this.selectedLocation.address,
        center: {
          id: this.selectedLocation.center.id,
          name: this.selectedLocation.center.name,
          distance: this.selectedLocation.center.distance
        },
        userCoords: this.selectedLocation.userCoords
      });
    } else {
      console.log('No location selected yet');
    }

    // Check form validity
    const error = this.validateRequest();
    console.log('Form Validation:', error || 'Valid');

    // Log the current missing fields
    console.log('Missing Fields:', this.missingFields.length > 0 ? this.missingFields : 'None');

    // Print a summary
    console.table({
      'User Profile Loaded': !!this.userProfile,
      'Identity Number': !!this.identityNumber,
      'Birth Date': !!this.birthDate,
      'Location Selected': !!this.selectedLocation,
      'Profile Complete': this.profileComplete,
      'Form Valid': !error,
      'Can Submit': this.profileComplete && !!this.selectedLocation && !this.loading && !error
    });
  }

  // Add method to check for existing requests
  checkExistingRequest() {
    this.cpfRequestService.getCpfRequests().subscribe({
      next: (requests) => {
        console.log('Existing requests:', requests);
        if (requests && requests.length > 0) {
          // Show alert for existing request
          this.showAlertMessage('You already have an existing CPF request', 'error');
          
          
        }
      },
      error: (error) => {
        console.error('Error checking existing requests:', error);
      }
    });
  }
}
