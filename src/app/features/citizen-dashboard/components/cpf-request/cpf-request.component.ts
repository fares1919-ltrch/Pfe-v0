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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTimepickerModule } from '@angular/material/timepicker';

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
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTimepickerModule
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
  missingFields: string[] = [];
  selectedLocation: LocationInfo | null = null;
  nearestCenter: string = '';
  centerDistance: number = 0;
  userProfile: any = null;
  showCalendar: boolean = false;
  selectedDate: Date | null = null;
  minDate: Date;
  maxDate: Date;
  selectedTime: string | null = null;
  availableTimeSlots: string[] = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];
  bookedTimeSlots: { [key: string]: string[] } = {};

  // Add validation patterns
  private readonly TIME_PATTERN = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  private readonly DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  // Add arrays to track available and unavailable dates
  availableDates: Date[] = [];
  unavailableDates: Date[] = [];

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
    
    // Set min date to tomorrow
    this.minDate = new Date();
    this.minDate.setDate(this.minDate.getDate() + 1);
    
    // Set max date to 3 months from now
    this.maxDate = new Date();
    this.maxDate.setMonth(this.maxDate.getMonth() + 3);

    // Load booked time slots (this would typically come from your backend)
    this.loadBookedTimeSlots();
    this.loadAvailableDates();
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

  showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }

  toggleCalendar(): void {
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  onDateSelected(event: any): void {
    const dateStr = event.value ? event.value.toISOString().split('T')[0] : '';
    
    if (dateStr && this.validateDateInput(dateStr)) {
      if (this.isDateAvailable(event.value)) {
        this.selectedDate = event.value;
        this.selectedTime = null; // Reset selected time when date changes
      } else {
        this.showSnackBar('This date is not available. Please select another date.', 'error');
        this.selectedDate = null;
      }
    } else {
      this.selectedDate = null;
    }
  }

  loadBookedTimeSlots() {
    // This is a mock implementation. In a real application, you would fetch this from your backend
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.bookedTimeSlots = {
      [tomorrow.toISOString().split('T')[0]]: ['09:00 AM', '10:30 AM', '02:00 PM']
    };
  }

  isTimeSlotAvailable(timeSlot: string): boolean {
    if (!this.selectedDate) return false;
    
    const dateKey = this.selectedDate.toISOString().split('T')[0];
    const bookedSlots = this.bookedTimeSlots[dateKey] || [];
    
    // Convert time slot to 24-hour format for comparison
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    if (timeRegex.test(timeSlot)) {
      const [timeStr, period] = timeSlot.split(' ');
      let [hours, minutes] = timeStr.split(':').map(Number);
      
      if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }

      const time24Hour = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      return !bookedSlots.includes(time24Hour);
    }
    
    return false;
  }

  selectTimeSlot(time: string) {
    // Convert 12-hour format to 24-hour format
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    if (timeRegex.test(time)) {
      const [timeStr, period] = time.split(' ');
      let [hours, minutes] = timeStr.split(':').map(Number);
      
      // Convert to 24-hour format
      if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }

      const time24Hour = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      if (this.validateTimeInput(time24Hour)) {
        this.selectedTime = time;
      } else {
        this.selectedTime = null;
      }
    } else {
      this.showSnackBar('Please enter time in format HH:MM AM/PM (e.g., 09:30 AM)', 'error');
      this.selectedTime = null;
    }
  }

  validateRequest(): boolean {
    console.log('Validating request before submission');

    if (this.missingFields.length > 0) {
      console.error('Profile validation failed: Missing required fields', this.missingFields);
      this.showSnackBar(`Please complete your profile. Missing fields: ${this.missingFields.join(', ')}`, 'error');
      return false;
    }

    if (!this.selectedLocation) {
      console.error('Request validation failed: No location selected');
      this.showSnackBar('Please select a location on the map', 'error');
      return false;
    }

    if (!this.selectedDate || !this.selectedTime) {
      console.error('Request validation failed: No date or time selected');
      this.showSnackBar('Please select both date and time for your appointment', 'error');
      return false;
    }

    if (!this.selectedLocation.userCoords ||
        !this.selectedLocation.userCoords.lat ||
        !this.selectedLocation.userCoords.lon) {
      console.error('Request validation failed: Missing user coordinates');
      this.showSnackBar('Location information is incomplete. Please try selecting your location again.', 'error');
      return false;
    }

    console.log('Request validation successful');
    return true;
  }

  onSubmit(): void {
    console.log('Submit button clicked');
    this.loading = true;

    if (!this.validateRequest()) {
      this.loading = false;
      return;
    }

    if (!this.selectedLocation?.center?.id) {
      console.error('No center ID available');
      this.showSnackBar('Please select a valid service center', 'error');
      this.loading = false;
      return;
    }

    console.log('Preparing request data', {
      identityNumber: this.identityNumber,
      location: this.selectedLocation,
      centerId: this.selectedLocation.center.id,
      appointmentDate: this.selectedDate,
      appointmentTime: this.selectedTime
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
      cost: this.cost.split(' ')[0],
      appointmentDate: this.selectedDate,
      appointmentTime: this.selectedTime
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
        this.showSnackBar('Request submitted successfully', 'success');
        this.router.navigate(['/citizen-dashboard/cpf-request']);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error submitting CPF request', error);
        
        if (error.status === 400) {
          if (error.error?.message?.includes('already exists')) {
            this.showSnackBar('You already have an existing CPF request', 'error');
          } else if (error.error?.message) {
            this.showSnackBar(error.error.message, 'error');
          } else {
            this.showSnackBar('Please check your request details and try again.', 'error');
          }
        } else if (error.status === 401) {
          this.showSnackBar('Your session has expired. Please log in again.', 'error');
          this.router.navigate(['/auth/login']);
        } else if (error.status === 404) {
          this.showSnackBar('The selected center is no longer available. Please choose another center.', 'error');
        } else {
          this.showSnackBar('There was an error submitting your request. Please try again later.', 'error');
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
          this.showSnackBar('You already have an existing CPF request', 'error');
        }
      },
      error: (error) => {
        console.error('Error checking existing requests:', error);
      }
    });
  }

  editDate(): void {
    this.selectedDate = null;
    this.selectedTime = null;
  }

  editTime(): void {
    this.selectedTime = null;
  }

  // Add validation methods
  validateDateInput(date: string): boolean {
    if (!this.DATE_PATTERN.test(date)) {
      this.showSnackBar('Invalid date format. Please use YYYY-MM-DD', 'error');
      return false;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      this.showSnackBar('Cannot select a date in the past', 'error');
      return false;
    }

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);

    if (selectedDate > maxDate) {
      this.showSnackBar('Cannot select a date more than 3 months in advance', 'error');
      return false;
    }

    // Check if it's a weekend
    const day = selectedDate.getDay();
    if (day === 0 || day === 6) {
      this.showSnackBar('Cannot select weekends', 'error');
      return false;
    }

    return true;
  }

  validateTimeInput(time: string): boolean {
    if (!this.TIME_PATTERN.test(time)) {
      this.showSnackBar('Invalid time format. Please use HH:MM (24-hour format)', 'error');
      return false;
    }

    const [hours, minutes] = time.split(':').map(Number);
    
    // Check if time is within working hours (8 AM to 5 PM)
    if (hours < 8 || hours > 17 || (hours === 17 && minutes > 0)) {
      this.showSnackBar('Please select a time between 8:00 AM and 5:00 PM', 'error');
      return false;
    }

    // Check if minutes are in 30-minute intervals
    if (minutes !== 0 && minutes !== 30) {
      this.showSnackBar('Please select a time in 30-minute intervals', 'error');
      return false;
    }

    // Check if the time slot is already booked
    if (this.selectedDate) {
      const dateKey = this.selectedDate.toISOString().split('T')[0];
      const bookedSlots = this.bookedTimeSlots[dateKey] || [];
      const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      if (bookedSlots.includes(timeFormatted)) {
        this.showSnackBar('This time slot is already booked', 'error');
        return false;
      }
    }

    return true;
  }

  loadAvailableDates() {
    // This is a mock implementation. In a real application, you would fetch this from your backend
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    // Mark weekends as unavailable
    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day === 0 || day === 6) { // Weekend
        this.unavailableDates.push(new Date(d));
      } else {
        // Randomly mark some weekdays as unavailable for demonstration
        if (Math.random() < 0.2) { // 20% chance of being unavailable
          this.unavailableDates.push(new Date(d));
        } else {
          this.availableDates.push(new Date(d));
        }
      }
    }
  }

  isDateAvailable(date: Date): boolean {
    // Check if the date is in the unavailable dates array
    return !this.unavailableDates.some(unavailableDate => 
      unavailableDate.getDate() === date.getDate() &&
      unavailableDate.getMonth() === date.getMonth() &&
      unavailableDate.getFullYear() === date.getFullYear()
    );
  }

  dateClass(date: Date): string {
    if (!this.isDateAvailable(date)) {
      return 'unavailable-date';
    }
    return 'available-date';
  }
}
