import { Component, OnInit, HostListener, ElementRef, QueryList, ViewChildren, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { UserService } from '../../../core/services/user.service';
import { ProfileService } from '../../../core/services/profile.service';
import { HttpEvent, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { catchError, of, throwError } from 'rxjs';

@Component({
  selector: 'app-body',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements OnInit, AfterViewInit {
  currentUser: any;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  isSubmitting: boolean = false;
  isSubmittingPassword: boolean = false;
  showPasswordModal: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'success';
  alertTimeout: any;

  selectedFile: File | null = null;
  uploading: boolean = false;
  profileImageUrl: string = 'assets/images/default-profile.jpg';

  // Session management
  activeSessions: any[] = [];
  isLoadingSessions: boolean = false;
  isAuthenticated: boolean = false;
  tokenExpired: boolean = false;

  @ViewChildren('profileSection') profileSections!: QueryList<ElementRef>;

  constructor(
    private tokenStorage: TokenStorageService,
    private userService: UserService,
    private profileService: ProfileService,
    private fb: FormBuilder,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.currentUser = this.tokenStorage.getUser();
    this.isAuthenticated = !!this.tokenStorage.getToken();

    if (!this.isAuthenticated) {
      console.warn('User is not authenticated, redirecting to login');
      this.router.navigate(['/auth/login']);
      return;
    }

    console.log('User authenticated, initializing profile');
    this.initForms();
    this.loadUserProfile();
    this.loadActiveSessions();
  }

  ngAfterViewInit() {
    // Initial check for elements in viewport
    setTimeout(() => {
      this.checkSectionsInViewport();
    }, 100);
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.checkSectionsInViewport();
  }

  checkSectionsInViewport() {
    const sections = this.elementRef.nativeElement.querySelectorAll('.profile-section');

    sections.forEach((section: HTMLElement) => {
      const rect = section.getBoundingClientRect();
      const isInViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );

      if (isInViewport) {
        section.classList.add('visible');
      }
    });
  }

  initForms() {
    this.profileForm = this.fb.group({
      username: [{value: '', disabled: true}, Validators.required],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
      address: [''],
      city: [''],
      country: [''],
      postalCode: [''],
      aboutMe: [''],
      work: [''],
      workplace: ['']
    });

    // Initialize form with data from token storage if available
    if (this.currentUser) {
      this.profileForm.patchValue({
        username: this.currentUser.username || '',
        email: this.currentUser.email || '',
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || ''
      });
    }

    // ====================================================
    // PASSWORD FORM INITIALIZATION AND VALIDATION RULES
    // ====================================================
    //
    // Password Requirements (same as signup):
    // 1. Length: Minimum 8 characters
    // 2. Must contain at least one uppercase letter (A-Z)
    // 3. Must contain at least one lowercase letter (a-z)
    // 4. Must contain at least one number (0-9)
    // 5. Must contain at least one special character from: @$!%*?&
    //
    // Validation Pattern Explanation:
    // ^                 - Start of string
    // (?=.*[a-z])      - At least one lowercase letter
    // (?=.*[A-Z])      - At least one uppercase letter
    // (?=.*\d)         - At least one digit
    // (?=.*[@$!%*?&])  - At least one special character
    // [A-Za-z\d@$!%*?&]{8,} - Match any of these characters, minimum 8
    // $                 - End of string
    //
    // Note: All requirements are validated in real-time as user types
    //       and shown in the UI with checkmarks
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // ====================================================
  // PASSWORD VALIDATION METHODS
  // ====================================================
  // These methods are used in the template to show checkmarks
  // next to requirements as they are met
  // Each method returns true if the requirement is satisfied

  // Check if password has minimum length of 8 characters
  hasMinLength(): boolean {
    return this.passwordForm.get('newPassword')?.value?.length >= 8;
  }

  // Check if password contains at least one uppercase letter
  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.passwordForm.get('newPassword')?.value || '');
  }

  // Check if password contains at least one lowercase letter
  hasLowerCase(): boolean {
    return /[a-z]/.test(this.passwordForm.get('newPassword')?.value || '');
  }

  // Check if password contains at least one number
  hasNumber(): boolean {
    return /[0-9]/.test(this.passwordForm.get('newPassword')?.value || '');
  }

  // Check if password contains at least one special character
  hasSpecialChar(): boolean {
    return /[@$!%*?&]/.test(this.passwordForm.get('newPassword')?.value || '');
  }

  // ====================================================
  // PASSWORD MATCH VALIDATOR
  // ====================================================
  // Custom validator to ensure new password and confirm password match
  // Returns null if passwords match, { mismatch: true } if they don't
  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  loadUserProfile() {
    this.isSubmitting = true;
    console.log('Loading user profile...');
    console.log('Authentication status:', this.isAuthenticated);
    console.log('Current user from token storage:', this.currentUser);

    // Check if token exists before making API call
    if (!this.tokenStorage.getToken()) {
      console.error('No authentication token found');
      this.isSubmitting = false;
      this.showAlert('Authentication error. Please log in again.', 'error');
      setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      return;
    }

    this.profileService.getUserProfile()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Profile loading error:', error);

          if (error.status === 403 || error.status === 401) {
            this.tokenExpired = true;
            this.showAlert('Your session has expired. Please log in again.', 'error');
            this.tokenStorage.signOut();
            setTimeout(() => this.router.navigate(['/auth/login']), 2000);
          } else {
            this.showAlert('Failed to load profile data', 'error');
          }

          // Use cached user data as fallback
          if (this.currentUser) {
            this.profileForm.patchValue({
              username: this.currentUser.username || '',
              email: this.currentUser.email || '',
              firstName: this.currentUser.firstName || '',
              lastName: this.currentUser.lastName || ''
            });
          }

          this.isSubmitting = false;
          return of(null); // Return empty observable to continue the chain
        })
      )
      .subscribe(data => {
        this.isSubmitting = false;

        if (!data) return; // Skip if we got an error

        console.log('Profile data received:', data);

        this.profileForm.patchValue({
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          address: data.address,
          city: data.city,
          country: data.country,
          postalCode: data.postalCode,
          aboutMe: data.aboutMe,
          work: data.work,
          workplace: data.workplace
        });

        if (data.photo) {
          this.profileImageUrl = data.photo.startsWith('http')
            ? data.photo
            : `${environment.apiUrl}${data.photo}`;
        }
      });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;

    this.isSubmitting = true;
    const formData = new FormData();

    // Add form values to formData
    const formValue = this.profileForm.getRawValue();
    Object.keys(formValue).forEach(key => {
      if (key !== 'username' && key !== 'email') {
        formData.append(key, formValue[key]);
      }
    });

    // Add file if selected
    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    this.profileService.updateProfile(formData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Profile update error:', error);
          this.isSubmitting = false;

          if (error.status === 403 || error.status === 401) {
            this.tokenExpired = true;
            this.showAlert('Your session has expired. Please log in again.', 'error');
            this.tokenStorage.signOut();
            setTimeout(() => this.router.navigate(['/auth/login']), 2000);
          } else {
            this.showAlert('Failed to update profile', 'error');
          }

          return of(null);
        })
      )
      .subscribe(response => {
        this.isSubmitting = false;

        if (!response) return; // Skip if we got an error

        this.showAlert('Profile updated successfully', 'success');

        // Update current user in storage
        const user = this.tokenStorage.getUser();
        if (user) {
          user.firstName = formValue.firstName;
          user.lastName = formValue.lastName;
          this.tokenStorage.saveUser(user);
        }
      });
  }

  changePassword() {
    if (this.passwordForm.invalid) return;

    this.isSubmittingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.profileService.changePassword(currentPassword, newPassword)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Password change error:', error);
          this.isSubmittingPassword = false;

          if (error.status === 403 || error.status === 401) {
            this.tokenExpired = true;
            this.showAlert('Your session has expired. Please log in again.', 'error');
            this.closePasswordModal();
            this.tokenStorage.signOut();
            setTimeout(() => this.router.navigate(['/auth/login']), 2000);
          } else {
            this.showAlert(error.error?.message || 'Failed to change password. Please check your current password.', 'error');
          }

          return of(null);
        })
      )
      .subscribe(response => {
        this.isSubmittingPassword = false;

        if (!response) return; // Skip if we got an error

        this.closePasswordModal();
        this.showAlert('Password changed successfully', 'success');
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];

      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImageUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  openChangePasswordModal() {
    this.passwordForm.reset();
    this.showPasswordModal = true;
  }

  closePasswordModal() {
    this.showPasswordModal = false;
  }

  showAlert(message: string, type: 'success' | 'error') {
    this.alertMessage = message;
    this.alertType = type;

    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }

    this.alertTimeout = setTimeout(() => {
      this.closeAlert();
    }, 5000);
  }

  closeAlert() {
    this.alertMessage = '';
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
  }

  // Session management methods
  loadActiveSessions() {
    // Only attempt to load sessions if authenticated
    if (!this.isAuthenticated) {
      console.warn('Not loading sessions: user not authenticated');
      return;
    }

    this.isLoadingSessions = true;
    this.profileService.getActiveSessions()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Sessions loading error:', error);
          this.isLoadingSessions = false;

          if (error.status === 403 || error.status === 401) {
            // Don't show alert here to avoid confusion with the profile error
            // that will likely trigger at the same time
            console.warn('Authentication error when loading sessions');
            this.tokenExpired = true;
          } else {
            this.showAlert('Failed to load active sessions', 'error');
          }

          return of([]);
        })
      )
      .subscribe(sessions => {
        this.activeSessions = sessions || [];
        this.isLoadingSessions = false;
      });
  }

  revokeSession(sessionToken: string) {
    this.profileService.revokeSession(sessionToken)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Session revocation error:', error);

          if (error.status === 403 || error.status === 401) {
            this.tokenExpired = true;
            this.showAlert('Your session has expired. Please log in again.', 'error');
            this.tokenStorage.signOut();
            setTimeout(() => this.router.navigate(['/auth/login']), 2000);
          } else {
            this.showAlert('Failed to revoke session', 'error');
          }

          return of(null);
        })
      )
      .subscribe(response => {
        if (!response) return; // Skip if we got an error

        this.showAlert('Session revoked successfully', 'success');
        this.loadActiveSessions();
      });
  }

  deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.profileService.deleteAccount()
        .pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('Account deletion error:', error);

            if (error.status === 403 || error.status === 401) {
              this.tokenExpired = true;
              this.showAlert('Your session has expired. Please log in again.', 'error');
              this.tokenStorage.signOut();
              setTimeout(() => this.router.navigate(['/auth/login']), 2000);
            } else {
              this.showAlert('Failed to delete account', 'error');
            }

            return of(null);
          })
        )
        .subscribe(response => {
          if (!response) return; // Skip if we got an error

          this.tokenStorage.signOut();
          this.router.navigate(['/auth/login']);
        });
    }
  }
}
