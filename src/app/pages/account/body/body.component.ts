import { Component, OnInit, HostListener, ElementRef, QueryList, ViewChildren, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { UserService } from '../../../core/services/user.service';
import { ProfileService } from '../../../core/services/profile.service';
import { HttpEvent, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { catchError, of, throwError, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface AlertConfig {
  message: string;
  type: 'success' | 'error';
}

interface UserProfile {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  identityNumber: string;
  aboutMe: string;
  work: string;
  workplace: string;
  photo: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  location?: {
    lat: number;
    lon: number;
  };
}

interface Session {
  token: string;
  device?: string;
  ipAddress?: string;
  lastActive?: Date | string;
  deviceType?: string;
  location?: string;
  current?: boolean;
}

@Component({
  selector: 'app-body',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements OnInit, AfterViewInit {
  currentUser: UserProfile | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  isSubmitting: boolean = false;
  isSubmittingPassword: boolean = false;
  showPasswordModal: boolean = false;
  public alertMessage: string = '';
  public alertType: string = '';
  private alertTimeout: any;

  selectedFile: File | null = null;
  uploading: boolean = false;
  profileImageUrl: string = 'assets/images/default-profile.jpg';

  // Field edit state properties
  isBirthDateReadOnly: boolean = false;
  isIdentityNumberReadOnly: boolean = false;

  // Session management
  activeSessions: Session[] = [];
  isLoadingSessions: boolean = false;
  isAuthenticated: boolean = false;
  tokenExpired: boolean = false;

  // Browser check
  isBrowser: boolean;

  @ViewChildren('profileSection') profileSections!: QueryList<ElementRef>;

  constructor(
    private tokenStorage: TokenStorageService,
    private userService: UserService,
    private profileService: ProfileService,
    private fb: FormBuilder,
    private router: Router,
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.initializeForms();
  }

  ngOnInit() {
    // Only perform browser-specific operations if in browser environment
    if (!this.isBrowser) return;

    this.currentUser = this.tokenStorage.getUser();
    this.isAuthenticated = !!this.tokenStorage.getToken();

    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadUserProfile();
    this.loadActiveSessions();
  }

  ngAfterViewInit() {
    // Only perform browser-specific operations if in browser environment
    if (!this.isBrowser) return;

    // Initial check for elements in viewport
    setTimeout(() => {
      this.checkSectionsInViewport();
    }, 100);
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (!this.isBrowser) return;
    this.checkSectionsInViewport();
  }

  checkSectionsInViewport() {
    if (!this.isBrowser || !this.elementRef?.nativeElement) return;

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

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: [''],
      identityNumber: ['', Validators.pattern(/^\d{8,12}$/)],
      aboutMe: [''],
      work: [''],
      workplace: [''],
      photo: [''],
      address: [''],
      city: [''],
      country: [''],
      postalCode: [''],
    });

    if (this.currentUser) {
      this.profileForm.patchValue({
        username: this.currentUser.username || '',
        email: this.currentUser.email || '',
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        birthDate: this.currentUser.birthDate ? this.currentUser.birthDate.substring(0, 10) : '',
        identityNumber: this.currentUser.identityNumber || '',
        address: this.currentUser.address || '',
        city: this.currentUser.city || '',
        country: this.currentUser.country || '',
        postalCode: this.currentUser.postalCode || ''
      });
    }

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

  private passwordMatchValidator(formGroup: FormGroup): ValidationErrors | null {
    const newPassword = formGroup.get('newPassword');
    const confirmPassword = formGroup.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { mismatch: true };
  }

  birthDateValidator() {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return { required: true };
      }

      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        return { underage: true };
      }

      if (birthDate > today) {
        return { future: true };
      }
      return null;
    };
  }

  identityNumberValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }
      return this.userService.checkIdentityNumber(control.value).pipe(
        map(isAvailable => isAvailable ? null : { notUnique: true }),
        catchError(() => of(null))
      );
    };
  }

  identityNumberFormatValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const valid = /^\d{8,12}$/.test(control.value);
      return valid ? null : { invalidFormat: true };
    };
  }

  // For CPF requests we still validate birth date properly
  birthDateValidatorForCpf() {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return { required: true };
      }

      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        return { underage: true };
      }

      if (birthDate > today) {
        return { future: true };
      }
      return null;
    };
  }

  loadUserProfile() {
    this.isSubmitting = true;
    if (!this.tokenStorage.getToken()) {
      this.isSubmitting = false;
      this.showAlert('Authentication error. Please log in again.', 'error');
      setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      return;
    }

    this.profileService.getUserProfile()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.isSubmitting = false;
          if (error.status === 403 || error.status === 401) {
            this.tokenExpired = true;
            this.showAlert('Your session has expired. Please log in again.', 'error');
            this.tokenStorage.signOut();
            setTimeout(() => this.router.navigate(['/auth/login']), 2000);
          } else {
            this.showAlert('Failed to load user profile', 'error');
          }
          return of(null);
        })
      )
      .subscribe((data: any) => {
        this.isSubmitting = false;
        if (!data) return;

        console.log('Loaded user profile (raw):', data);

        // Set read-only flags based on user data
        this.isBirthDateReadOnly = !!data.birthDate && (typeof data.birthDate === 'string' ? data.birthDate.trim() !== '' : true);
        this.isIdentityNumberReadOnly = !!data.identityNumber && (data.identityNumber.toString().trim() !== '');

        // Format birthDate properly for the date input field (yyyy-MM-dd)
        let formattedBirthDate = '';
        if (data.birthDate) {
          try {
            // Create a Date object from the input
            const dateObj = new Date(data.birthDate);

            // Format as yyyy-MM-dd
            const year = dateObj.getFullYear();
            // Month is 0-indexed, so add 1 and ensure 2 digits with padStart
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            // Ensure 2 digits for day with padStart
            const day = String(dateObj.getDate()).padStart(2, '0');

            formattedBirthDate = `${year}-${month}-${day}`;
            console.log('Formatted birth date for input:', formattedBirthDate);
          } catch (e) {
            console.error('Error formatting birth date:', e);
            // Fallback to empty string if there's an error
            formattedBirthDate = '';
          }
        }

        // Create a normalized user object
        const normalizedUser: UserProfile = {
          username: data.username || '',
          email: data.email || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          birthDate: formattedBirthDate,
          identityNumber: data.identityNumber ? data.identityNumber.toString() : '',
          aboutMe: data.aboutMe || '',
          work: data.work || '',
          workplace: data.workplace || '',
          photo: data.photo || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          postalCode: data.postalCode || '',
          location: data.location || undefined
        };

        console.log('Normalized user profile:', normalizedUser);

        // Store the normalized user data
        this.currentUser = normalizedUser;

        // Update form values with normalized data
        this.profileForm.patchValue({
          username: normalizedUser.username,
          email: normalizedUser.email,
          firstName: normalizedUser.firstName,
          lastName: normalizedUser.lastName,
          birthDate: normalizedUser.birthDate,
          identityNumber: normalizedUser.identityNumber,
          aboutMe: normalizedUser.aboutMe,
          work: normalizedUser.work,
          workplace: normalizedUser.workplace,
          address: normalizedUser.address,
          city: normalizedUser.city,
          country: normalizedUser.country,
          postalCode: normalizedUser.postalCode
        });

        if (data.photo) {
          this.profileImageUrl = data.photo.startsWith('http')
            ? data.photo
            : `${environment.apiUrl}${data.photo}`;
        }
      });
  }

  saveProfile() {
    if (!this.isBrowser) return;

    const changedFields: Partial<UserProfile> = {};
    const formValue = this.profileForm.getRawValue();

    // Define field categories
    const freeChangeFields = ['firstName', 'lastName', 'aboutMe', 'work', 'workplace', 'address', 'city', 'country', 'postalCode'];
    const sensitiveFields = ['birthDate', 'identityNumber'];

    // Check which fields have been modified
    Object.keys(formValue).forEach(key => {
      if (key !== 'username' && key !== 'email') {
        let currentValue = formValue[key as keyof UserProfile];
        const existingValue = this.currentUser?.[key as keyof UserProfile];
        const control = this.profileForm.get(key);

        // Special handling for birthDate to ensure it's in the correct format
        if (key === 'birthDate' && currentValue) {
          try {
            // Ensure birthDate is in ISO format for backend
            const dateObj = new Date(currentValue);
            if (!isNaN(dateObj.getTime())) {
              currentValue = dateObj.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
            }
          } catch (e) {
            console.error('Error formatting birth date:', e);
          }
        }

        // Convert values to strings for consistent comparison
        const currentValueStr = currentValue !== null && currentValue !== undefined ? String(currentValue).trim() : '';
        const existingValueStr = existingValue !== null && existingValue !== undefined ? String(existingValue).trim() : '';

        // For debugging
        console.log(`Field: ${key}, Current: "${currentValueStr}", Existing: "${existingValueStr}", Changed: ${currentValueStr !== existingValueStr}`);

        // Only include fields that have been modified and are valid
        if (currentValueStr !== existingValueStr && (!control || !control.errors)) {
          // Special handling for sensitive fields
          if (sensitiveFields.includes(key)) {
            // Check if the field already has a value in the database
            if (existingValueStr !== '') {
              this.showAlert(`${key === 'birthDate' ? 'Birth date' : 'Identity number'} can only be set once`, 'error');
              // Reset the form value to the original value
              if (control) {
                const patch: any = {};
                patch[key] = existingValue;
                this.profileForm.patchValue(patch);
              }

              // Important: Skip adding this field to changedFields but continue with others
              return; // This return only exits the current iteration of forEach
            }
          }

          // Add the original (non-string) value to changedFields
          changedFields[key as keyof UserProfile] = currentValue;
        }
      }
    });

    // If no valid changes, show appropriate message
    if (Object.keys(changedFields).length === 0) {
      this.showAlert('No valid changes to save', 'error');
      return;
    }

    console.log('Changed fields:', changedFields);

    // Check for identity number uniqueness if it's being changed
    if (changedFields.identityNumber) {
      this.isSubmitting = true;
      this.profileService.checkIdentityNumberUnique(changedFields.identityNumber.toString())
        .pipe(
          catchError(() => {
            this.isSubmitting = false;
            return of(true); // Assume it's unique on error to allow the user to try
          })
        )
        .subscribe(isUnique => {
          if (!isUnique) {
            this.isSubmitting = false;
            this.showAlert('Identity number is already in use', 'error');
            // Reset the form value
            if (this.currentUser && this.currentUser.identityNumber) {
              this.profileForm.patchValue({
                identityNumber: this.currentUser.identityNumber
              });
            } else {
              this.profileForm.patchValue({
                identityNumber: ''
              });
            }

            // Remove the identity number from changed fields
            delete changedFields.identityNumber;

            // If we still have other changes, proceed with saving those
            if (Object.keys(changedFields).length > 0) {
              this.proceedWithProfileSave(changedFields);
            }
          } else {
            // Continue with saving the profile
            this.proceedWithProfileSave(changedFields);
          }
        });
    } else {
      // No identity number change, proceed normally
      this.proceedWithProfileSave(changedFields);
    }
  }

  private proceedWithProfileSave(changedFields: Partial<UserProfile>) {
    this.isSubmitting = true;
    const formData = new FormData();

    // Only append changed fields
    Object.keys(changedFields).forEach(key => {
      const value = changedFields[key as keyof UserProfile];
      if (value !== null && value !== undefined) {
        console.log(`Appending to form data: ${key} = ${value}`);
        if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    this.profileService.updateProfile(formData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.isSubmitting = false;
          const errorMessage = error.error?.message || 'Failed to update profile';
          this.showAlert(errorMessage, 'error');
          return of(null);
        })
      )
      .subscribe((response: any) => {
        this.isSubmitting = false;
        if (!response) return;

        console.log('Profile update response:', response);

        // Determine which fields were updated for the message
        const updatedFieldNames = Object.keys(changedFields)
          .map(key => {
            switch(key) {
              case 'firstName': return 'first name';
              case 'lastName': return 'last name';
              case 'birthDate': return 'birth date';
              case 'identityNumber': return 'identity number';
              case 'aboutMe': return 'about me';
              case 'work': return 'job title';
              case 'workplace': return 'workplace';
              default: return key;
            }
          });

        this.showAlert(`Profile updated successfully: ${updatedFieldNames.join(', ')}`, 'success');

        // Update read-only flags if sensitive fields were updated
        if (changedFields.birthDate) {
          this.isBirthDateReadOnly = true;
        }
        if (changedFields.identityNumber) {
          this.isIdentityNumberReadOnly = true;
        }

        // Update the current user object with the changed fields
        if (this.currentUser) {
          Object.keys(changedFields).forEach(key => {
            const value = changedFields[key as keyof UserProfile];
            if (value !== null && value !== undefined) {
              (this.currentUser as any)[key] = value;
            }
          });

          // Make a deep copy of the user object before saving to avoid reference issues
          const userToSave = JSON.parse(JSON.stringify(this.currentUser));

          // Get original user data with provider information
          const originalUser = this.tokenStorage.getUser();

          // Preserve important authentication fields that aren't part of the profile
          if (originalUser) {
            ['roles', 'provider', 'googleId', 'githubId', 'id', '_id'].forEach(field => {
              if (originalUser[field]) {
                userToSave[field] = originalUser[field];
              }
            });
          }

          console.log('Saving updated user:', userToSave);
          this.tokenStorage.saveUser(userToSave);
        }

        // Reload user profile to ensure we have the latest data from the server
        this.loadUserProfile();
      });
  }

  changePassword() {
    if (this.passwordForm.invalid) return;

    this.isSubmittingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.profileService.changePassword(currentPassword, newPassword)
      .pipe(
        catchError((error: HttpErrorResponse) => {
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
      .subscribe((response: any) => {
        this.isSubmittingPassword = false;

        if (!response) return;

        this.closePasswordModal();
        this.showAlert('Password changed successfully', 'success');
      });
  }

  onFileSelected(event: Event) {
    if (!this.isBrowser) return;

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.profileImageUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);

      // Automatically upload the photo when selected
      this.uploadPhotoOnly();
    }
  }

  uploadPhotoOnly() {
    if (!this.isBrowser || !this.selectedFile) {
      this.showAlert('No photo selected', 'error');
      return;
    }

    this.uploading = true;
    const formData = new FormData();
    formData.append('photo', this.selectedFile);

    this.profileService.updateProfile(formData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.uploading = false;
          const errorMessage = error.error?.message || 'Failed to upload photo';
          this.showAlert(errorMessage, 'error');
          return of(null);
        })
      )
      .subscribe((response: any) => {
        this.uploading = false;
        if (!response) return;

        this.showAlert('Profile photo updated successfully', 'success');
        this.selectedFile = null;

        if (response.photo) {
          this.profileImageUrl = response.photo.startsWith('http')
            ? response.photo
            : `${environment.apiUrl}${response.photo}`;
        }

        // Update the user object with the new photo
        if (this.currentUser) {
          this.currentUser.photo = response.photo;
          this.tokenStorage.saveUser(this.currentUser);
        }
      });
  }

  openChangePasswordModal() {
    this.passwordForm.reset();
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  public hasMinLength(): boolean {
    // Example: check password min length (replace with real logic)
    return this.passwordForm?.get('newPassword')?.value?.length >= 8;
  }

  public hasUpperCase(): boolean {
    return /[A-Z]/.test(this.passwordForm?.get('newPassword')?.value || '');
  }

  public hasLowerCase(): boolean {
    return /[a-z]/.test(this.passwordForm?.get('newPassword')?.value || '');
  }

  public hasNumber(): boolean {
    return /[0-9]/.test(this.passwordForm?.get('newPassword')?.value || '');
  }

  public hasSpecialChar(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.passwordForm?.get('newPassword')?.value || '');
  }

  public showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;

    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }

    this.alertTimeout = setTimeout(() => {
      this.closeAlert();
    }, 5000);
  }

  public closeAlert(): void {
    this.alertMessage = '';
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
  }

  loadActiveSessions() {
    if (!this.isAuthenticated) {
      return;
    }

    this.isLoadingSessions = true;
    this.profileService.getActiveSessions()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.isLoadingSessions = false;
          if (error.status === 403 || error.status === 401) {
            this.tokenExpired = true;
          } else {
            this.showAlert('Failed to load active sessions', 'error');
          }
          return of([]);
        })
      )
      .subscribe((sessions: Session[]) => {
        this.activeSessions = sessions || [];
        this.isLoadingSessions = false;
      });
  }

  revokeSession(sessionToken: string) {
    this.profileService.revokeSession(sessionToken)
      .pipe(
        catchError((error: HttpErrorResponse) => {
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
      .subscribe((response: any) => {
        if (!response) return;
        this.showAlert('Session revoked successfully', 'success');
        this.loadActiveSessions();
      });
  }

  deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.profileService.deleteAccount()
        .pipe(
          catchError((error: HttpErrorResponse) => {
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
        .subscribe((response: any) => {
          if (!response) return;
          this.tokenStorage.signOut();
          this.router.navigate(['/auth/login']);
        });
    }
  }
}
