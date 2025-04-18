import { Component, OnInit, HostListener, ElementRef, QueryList, ViewChildren, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { UserService } from '../../../core/services/user.service';
import { ProfileService } from '../../../core/services/profile.service';
import { HttpEvent, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { catchError, of, throwError, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { existsSync } from 'fs';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  disableButton: boolean = false;

  selectedFile: File | null = null;
  uploading: boolean = false;
  profileImageUrl: string = 'assets/images/default-profile.jpg';

  // Session management
  activeSessions: Session[] = [];
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
    private elementRef: ElementRef,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit() {
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

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: ['', [Validators.required]],
      identityNumber: ['', [Validators.required, Validators.pattern(/^\d{8,12}$/)]],
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

    if (newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      confirmPassword.setErrors(null);
      return null;
    }
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
      .subscribe((data: UserProfile | null) => {
        this.isSubmitting = false;
        if (!data) return;
        this.profileForm.patchValue({
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: data.birthDate ? data.birthDate.substring(0, 10) : '',
          identityNumber: data.identityNumber,
          aboutMe: data.aboutMe,
          work: data.work,
          workplace: data.workplace,
          address: data.address,
          city: data.city,
          country: data.country,
          postalCode: data.postalCode
        });
        if (data.photo) {
          this.profileImageUrl = data.photo.startsWith('http')
            ? data.photo
            : `${environment.apiUrl}${data.photo}`;
        }
      });
  }

  saveProfile() {
    const changedFields: Partial<UserProfile> = {};
    const formValue = this.profileForm.getRawValue();

    // Check which fields have been modified
    Object.keys(formValue).forEach(key => {
      if (key !== 'username' && key !== 'email' ) {
        const currentValue = formValue[key as keyof UserProfile];
        const existingValue = this.currentUser?.[key as keyof UserProfile];

        // Only include fields that have been modified and are valid
        const control = this.profileForm.get(key);
        if (currentValue !== existingValue && (!control || !control.errors)) {
          changedFields[key as keyof UserProfile] = currentValue;
        }
      }
    });

    // If no valid changes, show appropriate message
    if (Object.keys(changedFields).length === 0) {
      this.showAlert('No valid changes to save', 'error');
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();

    // Only append changed fields
    Object.keys(changedFields).forEach(key => {
      const value = changedFields[key as keyof UserProfile];
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

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
        this.showAlert('Profile updated successfully', 'success');

        // Update only the changed fields in the current user object
        const updatedUser = { ...this.currentUser! };
        Object.keys(changedFields).forEach(key => {
          const value = changedFields[key as keyof UserProfile];
          if (typeof value === 'object' && value !== null) {
            (updatedUser as any)[key] = value;
          } else {
            (updatedUser as any)[key] = value;
          }
        });

        this.tokenStorage.saveUser(updatedUser);
        this.currentUser = updatedUser;
      });
  }

  changePassword() {
    this.isSubmittingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    const username = this.profileForm.value.username;

    this.profileService.changePassword(currentPassword, newPassword, username)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.isSubmittingPassword = false;
          this.disableButton = false;

          if (error.status === 400) {
            if (error.error?.message?.includes('current password')) {
              this.snackBar.open('Current password is incorrect', 'Close', {
                duration: 5000,
                panelClass: ['error-snackbar'],
                horizontalPosition: 'center',
                verticalPosition: 'bottom'
              });
            } else {
              this.snackBar.open(error.error?.message || 'Failed to change password', 'Close', {
                duration: 5000,
                panelClass: ['error-snackbar'],
                horizontalPosition: 'center',
                verticalPosition: 'bottom'
              });
            }
          } else if (error.status === 403 || error.status === 401) {
            this.tokenExpired = true;
            this.snackBar.open('Your session has expired. Please log in again.', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
            this.closePasswordModal();
            this.tokenStorage.signOut();
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          } else {
            this.snackBar.open('An error occurred while changing your password', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
          }
          return of(null);
        })
      )
      .subscribe((response: any) => {
        this.isSubmittingPassword = false;
        this.disableButton = false;

        if (!response) return;

        this.closePasswordModal();
        this.snackBar.open('Password changed successfully', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      });
  }

  openChangePasswordModal() {
    this.passwordForm.reset();
    this.showPasswordModal = true;
    console.log(this.showPasswordModal,"modal")
    console.log(this.passwordForm,"form")
    
    
  }

  submitPasswordChange() {
    const { confirmPassword, newPassword, currentPassword } = this.passwordForm.value;
   
    if (confirmPassword !== newPassword) {
      this.snackBar.open('New passwords do not match', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
      return;
    }

    if (!currentPassword) {
      this.snackBar.open('Please enter your current password', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
      return;
    }

    this.disableButton = true;
    this.changePassword();
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.profileImageUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
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
