import { Component, Renderer2, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MapsComponent } from './maps/maps.component';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, NgForm, ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TokenStorageService } from '../../../../core/services/token-storage.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { CenterService } from '../../../../core/services/center.service';
import { finalize } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule, DateFilterFn } from '@angular/material/datepicker';
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
    ReactiveFormsModule,
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
export class CpfRequestComponent implements OnInit {
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
  dateControl = new FormControl<Date | null>(null);
  availableTimeSlots: string[] = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];
  bookedTimeSlots: { [key: string]: string[] } = {};

  // Add validation patterns
  private readonly TIME_PATTERN = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  private readonly DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  // Add arrays to track available and unavailable dates
  availableDates: string[] = [];
  unavailableDates: string[] = [];

  // Add properties for debug calendar
  showDebugCalendar: boolean = true;  // Enable debug calendar
  debugDates: Date[] = [];
  currentMonth: string = '';
  currentYear: number = 0;
  weekDays: string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  emptyDays: number[] = [];
  debugCalendarDate: Date = new Date();

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService,
    private profileService: ProfileService,
    private appointmentService: AppointmentService,
    private centerService: CenterService,
    private router: Router,
    private snackBar: MatSnackBar,
    private renderer: Renderer2,
    private elementRef: ElementRef
  ) {
    this.loadUserProfile();
    this.checkExistingAppointment();

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
      return;
    }

    this.selectedLocation = locationInfo;

    // Handle case where no center was found but we still have user coordinates
    if (locationInfo.center.id === 'no-center' || !locationInfo.center.name) {
      this.nearestCenter = 'No Available Center';
      this.centerDistance = 0;
    } else {
      this.nearestCenter = locationInfo.center.name;
      this.centerDistance = locationInfo.center.distance;

      // Load availability for the selected center
      this.loadCenterAvailability();
    }

    // Format address for display
    if (locationInfo.address) {
      this.address = `${locationInfo.address.street || ''}, ${locationInfo.address.city || ''}, ${locationInfo.address.state || ''} ${locationInfo.address.postalCode || ''}`;
    } else {
      this.address = 'Address information not available';
    }
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
      
      // Make sure debug calendar is ready
      if (this.showDebugCalendar && this.debugDates.length === 0) {
        this.generateDebugDates();
      }

      // Try to set up calendar listeners after a delay
      setTimeout(() => {
        const calendarContainer = document.querySelector('.mat-calendar');
        if (calendarContainer) {
          this.attachCalendarListeners();
        } else {
          this.showDebugCalendar = true;
        }
      }, 500);
    } else {
      document.body.style.overflow = '';
    }
  }

  onDateSelected(event: any): void {
    // Handle both direct input and MatDatepickerInput events
    const dateObj = event.value || event;

    if (!dateObj) {
      this.selectedDate = null;
      this.selectedTime = null;
      return;
    }

    // Check if date is available using our filter method
    if (this.isDateAvailable(dateObj)) {
      this.selectedDate = dateObj;
      this.selectedTime = null; // Reset selected time when date changes
      
      // Load time slots for the selected date
      this.loadTimeSlots();

      // Force update calendar cells with click handlers
      this.setupCalendarCellListeners();
    } else {
      // Don't log error, just show snackbar
      this.showSnackBar('This date is not available. Please select another date.', 'error');
      this.selectedDate = null;
    }
  }

  // New method to add click handlers to calendar cells
  setupCalendarCellListeners() {
    setTimeout(() => {
      try {
        // Try to find all calendar cells
        const calendarCells = document.querySelectorAll('.mat-calendar-body-cell');
        
        // Add click listeners to each cell
        calendarCells.forEach((cell) => {
          // Add click listener
          this.renderer.listen(cell, 'click', () => {
            // Implementation remains but without logging
          });
        });
      } catch (err) {
        console.error('Error setting up calendar cell listeners:', err);
      }
    }, 500);
  }

  onCalendarClosed(): void {
    // If a date has been selected, ensure we're showing the time selection step
    if (this.selectedDate) {
      console.log('Calendar closed with selected date:', this.selectedDate);
      console.log('Current component state:', {
        selectedDate: this.selectedDate,
        selectedTime: this.selectedTime,
        showingTimeSelection: this.selectedDate && !this.selectedTime
      });
    } else {
      console.log('Calendar closed without a date selection');
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

    // Prepare full appointment date (combine date and time)
    let appointmentDateTime = null;
    if (this.selectedDate && this.selectedTime) {
      appointmentDateTime = new Date(this.selectedDate);
      const timeParts = this.selectedTime.match(/(\d+):(\d+)\s*([AP]M)/i);

      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const period = timeParts[3].toUpperCase();

        // Convert to 24-hour format
        if (period === 'PM' && hours < 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }

        appointmentDateTime.setHours(hours, minutes, 0, 0);
      }
    }

    // Only send centerId and appointmentDate (ISO string)
    const centerId = this.selectedLocation.center.id;
    const appointmentDate = appointmentDateTime ? appointmentDateTime.toISOString() : new Date().toISOString();

    this.appointmentService.createAppointment(centerId, appointmentDate).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (response) => {
        console.log('Appointment request submitted successfully', response);
        this.status = 'submitted';
        this.showSnackBar('Appointment request submitted successfully', 'success');
        this.showCalendar = false;
        setTimeout(() => {
          this.router.navigate(['/citizen-dashboard/appointment']);
        }, 1500);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error submitting appointment request', error);
        if (error.status === 400) {
          if (error.error?.message?.includes('already exists') || error.error?.message?.includes('existing appointment')) {
            // Check if the message indicates a status
            if (error.error?.message?.includes('cancelled')) {
              // This shouldn't happen based on our backend, but just in case
              this.showSnackBar('Your cancelled appointment is still being processed. Please try again in a few minutes.', 'error');
            } else if (error.error?.message?.includes('completed')) {
              this.showSnackBar('Your previous appointment was completed. Please visit the dashboard to check your CPF status.', 'error');
            } else {
              // Default message for active appointments
              this.showSnackBar('You already have an active appointment request. Please check your appointments page.', 'error');
            }
          } else if (error.error?.message) {
            this.showSnackBar(error.error.message, 'error');
          } else {
            this.showSnackBar('Please check your appointment details and try again.', 'error');
          }
        } else if (error.status === 401) {
          this.showSnackBar('Your session has expired. Please log in again.', 'error');
          this.router.navigate(['/auth/login']);
        } else if (error.status === 404) {
          this.showSnackBar('The selected center is no longer available. Please choose another center.', 'error');
        } else {
          this.showSnackBar('There was an error submitting your appointment request. Please try again later.', 'error');
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

  // Check for existing appointments
  checkExistingAppointment() {
    this.appointmentService.getUserAppointments().subscribe({
      next: (response) => {
        console.log('Existing appointments:', response);
        if (response && response.appointments && response.appointments.length > 0) {
          // Only check for active appointments (pending, validated, rejected)
          const activeAppointments = response.appointments.filter(appointment => 
            ['pending', 'validated', 'rejected'].includes(appointment.status)
          );
          
          if (activeAppointments.length > 0) {
            this.showSnackBar('You already have an existing appointment request', 'error');
          }
        }
      },
      error: (error) => {
        console.error('Error checking existing appointments:', error);
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
    this.availableDates = [];
    this.unavailableDates = [];
    // Only load from backend if a center is selected
    if (this.selectedLocation && this.selectedLocation.center.id) {
      const centerId = this.selectedLocation.center.id;
      this.centerService.getAvailableDates(centerId).subscribe({
        next: (response) => {
          if (response && response.availableDates) {
            this.processAvailableDates(response.availableDates);
          } else {
            this.availableDates = [];
            this.showSnackBar('No available dates returned from backend.', 'error');
          }
        },
        error: (error) => {
          console.error('Error loading center availability:', error);
          this.availableDates = [];
          this.showSnackBar('Could not load center availability. Please try again later.', 'error');
        }
      });
    }
  }

  processAvailableDates(availableDates: string[]) {
    // Store dates in YYYY-MM-DD format
    this.availableDates = availableDates.map(dateStr => {
      // Make sure we have a consistent format regardless of what the backend sends
      const date = new Date(dateStr);
      return this.formatDateToString(date);
    });
    
    this.unavailableDates = [];
    console.log(`Processed ${this.availableDates.length} available dates`);
  }

  // Update isDateAvailable to remove excessive logging
  isDateAvailable: DateFilterFn<Date | null> = (date: Date | null): boolean => {
    if (!date) return false;
    
    // Format date as YYYY-MM-DD for comparison with backend dates
    const dateStr = this.formatDateToString(date);
    return this.availableDates.includes(dateStr);
  }

  // New helper method to format dates consistently
  formatDateToString(date: Date): string {
    return [
      date.getFullYear(),
      (date.getMonth() + 1).toString().padStart(2, '0'),
      date.getDate().toString().padStart(2, '0')
    ].join('-');
  }

  dateClass = (date: Date): string => {
    // Log date being styled for debugging
    // console.log('Styling date:', date);

    if (!this.isDateAvailable(date)) {
      return 'unavailable-date';
    }
    return 'available-date';
  }

  ngOnInit(): void {
    console.log('Initializing CPF Request component');

    // Set min and max dates first
    this.minDate = new Date();
    this.maxDate = new Date();
    this.maxDate.setMonth(this.maxDate.getMonth() + 3);

    // Load available dates for the calendar
    this.loadAvailableDates();

    // Generate debug dates
    this.generateDebugDates();

    // Load booked time slots
    this.loadBookedTimeSlots();

    // Initialize the dateControl and subscribe to changes
    this.dateControl = new FormControl<Date | null>(null);
    this.dateControl.valueChanges.subscribe(date => {
      if (date) {
        console.log('Date selected from form control:', date);
        this.onDateSelected({ value: date });
      }
    });

    // Load user profile
    this.loadUserProfile();

    // Check for existing appointments
    this.checkExistingAppointment();
  }

  logInputClick(): void {
    console.log('Date input field clicked');
  }

  logMonthSelected(event: Date): void {
    console.log('Month selected:', event);
  }

  logYearSelected(event: Date): void {
    console.log('Year selected:', event);
  }

  // Override this method to add direct event handling in the view
  @ViewChild('picker') datePicker: any;

  ngAfterViewInit() {
    // Try to access the calendar to add direct event listeners
    setTimeout(() => {
      try {
        if (this.datePicker && this.datePicker._datepickerInput) {
          console.log('Datepicker initialized:', this.datePicker);

          // Try to find calendar cells and add click logging
          const calendarCells = document.querySelectorAll('.mat-calendar-body-cell');
          console.log(`Found ${calendarCells.length} calendar cells`);

          calendarCells.forEach((cell, index) => {
            this.renderer.listen(cell, 'click', (event) => {
              console.log(`Calendar cell ${index} clicked:`, event);
            });
          });
        }
      } catch (err) {
        console.error('Error setting up calendar debugging:', err);
      }
    }, 1000);
  }

  // Add methods for debug calendar
  generateDebugDates() {
    // Clear existing dates
    this.debugDates = [];

    // Use the current debug calendar date
    const year = this.debugCalendarDate.getFullYear();
    const month = this.debugCalendarDate.getMonth();

    // Set current month name and year
    this.currentMonth = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
    this.currentYear = year;

    // Calculate first day of month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate empty days at the beginning of the month
    this.emptyDays = Array(startDayOfWeek).fill(0);

    // Calculate last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Generate all dates for the month
    for (let i = 1; i <= daysInMonth; i++) {
      this.debugDates.push(new Date(year, month, i));
    }
  }

  debugSelectDate(date: Date) {
    this.onDateSelected({ value: date });
  }

  // Add new method for calendar opened event
  onCalendarOpened() {
    // Wait for the calendar to be fully rendered
    setTimeout(() => {
      this.attachCalendarListeners();
    }, 300);
  }

  attachCalendarListeners() {
    const calendar = document.querySelector('.mat-calendar');
    if (!calendar) {
      this.tryAttachListenersToDateCells();
      return;
    }

    // Attach click listener to the calendar itself for delegation
    this.renderer.listen(calendar, 'click', (event: any) => {
      // Check if the click is on a date cell
      const cell = event.target.closest('.mat-calendar-body-cell');
      if (cell) {
        const dateAttr = cell.getAttribute('aria-label');

        try {
          if (dateAttr) {
            const clickedDate = new Date(dateAttr);
            this.dateControl.setValue(clickedDate);
            this.onDateSelected({ value: clickedDate });
          }
        } catch (err) {
          // Silent error handling - no console logs
        }
      }
    });

    this.tryAttachListenersToDateCells();
  }

  tryAttachListenersToDateCells() {
    const cells = document.querySelectorAll('.mat-calendar-body-cell');

    if (cells.length === 0) {
      this.generateDebugDates();
      this.showDebugCalendar = true;
      return;
    }

    cells.forEach((cell: Element) => {
      const dateAttr = cell.getAttribute('aria-label');

      this.renderer.listen(cell, 'click', (event) => {
        event.stopPropagation();
        
        try {
          if (dateAttr) {
            const clickedDate = new Date(dateAttr);
            this.dateControl.setValue(clickedDate);
          }
        } catch {
          // Silent error handling - no console logs
        }
      });
    });
  }

  // Check if a date is today
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  // Check if a date is the currently selected date
  isSelectedDate(date: Date): boolean {
    if (!this.selectedDate) return false;

    return date.getDate() === this.selectedDate.getDate() &&
           date.getMonth() === this.selectedDate.getMonth() &&
           date.getFullYear() === this.selectedDate.getFullYear();
  }

  // Navigate to previous month
  prevMonth() {
    this.debugCalendarDate.setMonth(this.debugCalendarDate.getMonth() - 1);
    this.generateDebugDates();
  }

  // Navigate to next month
  nextMonth() {
    this.debugCalendarDate.setMonth(this.debugCalendarDate.getMonth() + 1);
    this.generateDebugDates();
  }

  loadCenterAvailability() {
    // Skip if no center is selected
    if (!this.selectedLocation || !this.selectedLocation.center.id) {
      return;
    }

    const centerId = this.selectedLocation.center.id;

    // First, reset our availability data
    this.availableDates = [];
    this.unavailableDates = [];

    // Call the service to get available dates
    this.centerService.getAvailableDates(centerId).subscribe({
      next: (response) => {
        if (response && response.availableDates) {
          // Process available dates from backend
          this.processAvailableDates(response.availableDates);
          
          // TEMPORARY: Add some June 2025 dates for testing
          // This is just for development/testing - remove in production
          const juneTestDates = [
            '2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05',
            '2025-06-09', '2025-06-10', '2025-06-11', '2025-06-12'
          ];
          
          this.availableDates = [...this.availableDates, ...juneTestDates];
        } else {
          // Fallback to default availability (weekends unavailable)
          this.loadDefaultAvailability();
        }
      },
      error: () => {
        // Fallback to default availability
        this.loadDefaultAvailability();
        this.showSnackBar('Could not load center availability. Using default schedule.', 'error');
      }
    });
  }

  loadDefaultAvailability() {
    // Default availability logic - only weekends unavailable
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d.getTime());
      const day = currentDate.getDay();

      const dateStr = this.formatDateToString(currentDate);
      if (day === 0 || day === 6) {
        // Weekends are unavailable
        this.unavailableDates.push(dateStr);
      } else {
        // Weekdays are available
        this.availableDates.push(dateStr);
      }
    }
  }

  // Update the time slot methods to use backend data
  loadTimeSlots() {
    if (!this.selectedLocation || !this.selectedDate) {
      return;
    }

    const centerId = this.selectedLocation.center.id;
    const dateStr = this.formatDateToString(this.selectedDate);

    this.centerService.getAvailableTimeSlots(centerId, dateStr).subscribe({
      next: (response) => {
        if (response && response.availableSlots) {
          this.availableTimeSlots = response.availableSlots;
        } else {
          // Fallback to default time slots
          this.loadDefaultTimeSlots();
        }
      },
      error: () => {
        this.loadDefaultTimeSlots();
        this.showSnackBar('Could not load available time slots. Using default slots.', 'error');
      }
    });
  }

  loadDefaultTimeSlots() {
    this.availableTimeSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];
  }

  // Modify getDebugDateClass to remove excessive logging
  getDebugDateClass(date: Date): string {
    const dateStr = this.formatDateToString(date);
    // Check if this date is in our available dates array
    const isAvailable = this.availableDates.includes(dateStr);
    
    if (isAvailable) {
      return 'available-date debug-available'; // green - combine both classes
    }
    return 'unavailable-date'; // red
  }
}
