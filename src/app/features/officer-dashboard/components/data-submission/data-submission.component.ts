import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BiometricService } from '../../../../core/services/biometric.service';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { MatIconModule } from '@angular/material/icon';
interface UserData {
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  email: string;
  
}

interface BiometricSubmission {
  userData: UserData;
  faceImage?: string;
  irisLeftImage?: string;
  irisRightImage?: string;
  fingerprintLeftThumb?: string;
  fingerprintLeftIndex?: string;
  fingerprintLeftMiddle?: string;
  fingerprintLeftRing?: string;
  fingerprintLeftPinky?: string;
  fingerprintRightThumb?: string;
  fingerprintRightIndex?: string;
  fingerprintRightMiddle?: string;
  fingerprintRightRing?: string;
  fingerprintRightPinky?: string;
}

@Component({
  selector: 'app-data-submission',
  standalone: true,
  imports: [CommonModule, FormsModule,MatIconModule],
  templateUrl: './data-submission.component.html',
  styleUrl: './data-submission.component.scss'
})
export class DataSubmissionComponent implements OnInit {
  @ViewChild('faceInput') faceInput!: ElementRef;
  @ViewChild('irisMultipleInput') irisMultipleInput!: ElementRef;
  @ViewChild('fingerprintMultipleInput') fingerprintMultipleInput!: ElementRef;

  userId: string | null = null;
  appointmentId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private biometricService: BiometricService,
    private snackBar: MatSnackBar,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.appointmentId = params['appointmentId'];
  
      console.log('userId:', this.userId);
      console.log('appointmentId:', this.appointmentId);
  
      if (!this.userId || !this.appointmentId) {
        console.error('userId or appointmentId is missing');
        this.snackBar.open('Invalid user or appointment ID', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        return;
      }
  
      this.userService.getUserById(this.userId).subscribe({
        next: (user) => {
          console.log('User details:in data-submission', user);
          if (user) {
            this.userData = {
              fullName: `${user.firstName} ${user.lastName}`,
              idNumber: user.identityNumber || 'N/A',
              dateOfBirth: user.birthDate ? user.birthDate.split('T')[0] : 'N/A',
              email: user.email || 'N/A'
            };
          }
        },
        error: (error) => {
          console.error('Error fetching user details:', error);
          this.snackBar.open('Failed to load user details', 'Close', {
            duration: 3000,
            panelClass: 'error-snackbar'
          });
        }
      });
    });
  }

  userData: UserData = {
    fullName: 'John Doe',
    idNumber: 'ID123456789',
    dateOfBirth: '1990-01-01',
    email: 'john.doe@example.com'
  };

  // Data storage
  faceImage: string | null = null;
  irisLeftImage: string | null = null;
  irisRightImage: string | null = null;
  
  fingerprintLeftThumbImage: string | null = null;
  fingerprintLeftIndexImage: string | null = null;
  fingerprintLeftMiddleImage: string | null = null;
  fingerprintLeftRingImage: string | null = null;
  fingerprintLeftPinkyImage: string | null = null;
  fingerprintRightThumbImage: string | null = null;
  fingerprintRightIndexImage: string | null = null;
  fingerprintRightMiddleImage: string | null = null;
  fingerprintRightRingImage: string | null = null;
  fingerprintRightPinkyImage: string | null = null;
  
  progressPercentage = 0;
  isUploading = false;

  get fingerprintImagesCount(): number {
    let count = 0;
    if (this.fingerprintLeftThumbImage) count++;
    if (this.fingerprintLeftIndexImage) count++;
    if (this.fingerprintLeftMiddleImage) count++;
    if (this.fingerprintLeftRingImage) count++;
    if (this.fingerprintLeftPinkyImage) count++;
    if (this.fingerprintRightThumbImage) count++;
    if (this.fingerprintRightIndexImage) count++;
    if (this.fingerprintRightMiddleImage) count++;
    if (this.fingerprintRightRingImage) count++;
    if (this.fingerprintRightPinkyImage) count++;
    return count;
  }

  get isSubmissionReady(): boolean {
    return this.faceImage !== null && 
           this.irisLeftImage !== null &&
           this.irisRightImage !== null &&
           this.fingerprintImagesCount === 10;
  }

  triggerFaceUpload(): void {
    this.faceInput.nativeElement.click();
  }

  triggerIrisMultipleUpload(): void {
    this.irisMultipleInput.nativeElement.click();
  }

  triggerFingerprintMultipleUpload(): void {
    this.fingerprintMultipleInput.nativeElement.click();
  }

  removeFingerprintImage(fingerType: string): void {
    switch (fingerType) {
      case 'leftThumb': this.fingerprintLeftThumbImage = null; break;
      case 'leftIndex': this.fingerprintLeftIndexImage = null; break;
      case 'leftMiddle': this.fingerprintLeftMiddleImage = null; break;
      case 'leftRing': this.fingerprintLeftRingImage = null; break;
      case 'leftPinky': this.fingerprintLeftPinkyImage = null; break;
      case 'rightThumb': this.fingerprintRightThumbImage = null; break;
      case 'rightIndex': this.fingerprintRightIndexImage = null; break;
      case 'rightMiddle': this.fingerprintRightMiddleImage = null; break;
      case 'rightRing': this.fingerprintRightRingImage = null; break;
      case 'rightPinky': this.fingerprintRightPinkyImage = null; break;
    }
  }

  private handleFileUpload(file: File, callback: (result: string) => void): void {
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      this.snackBar.open('Please upload only JPEG or PNG files', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    this.isUploading = true;
    this.progressPercentage = 0;

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        this.progressPercentage = (event.loaded / event.total) * 100;
      }
    };
    reader.onload = (e: any) => {
      callback(e.target.result);
      this.isUploading = false;
      this.progressPercentage = 100;
      setTimeout(() => {
        this.progressPercentage = 0;
      }, 1000);
    };
    reader.readAsDataURL(file);
  }

  onFaceFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleFileUpload(file, (result) => {
        this.faceImage = result;
      });
    }
  }

  onIrisMultipleSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    
    // Reset the input to allow selecting the same files again before processing
    const inputElement = event.target as HTMLInputElement;
    
    // Process files
    const neededScans = [];
    if (!this.irisLeftImage) neededScans.push('left');
    if (!this.irisRightImage) neededScans.push('right');
    
    // Limit to number of needed scans
    const maxFiles = Math.min(files.length, neededScans.length);
    
    for (let i = 0; i < maxFiles; i++) {
      const file = files[i];
      const scanType = neededScans[i];
      
      if (scanType === 'left') {
        this.handleFileUpload(file, (result) => {
          this.irisLeftImage = result;
        });
      } else if (scanType === 'right') {
        this.handleFileUpload(file, (result) => {
          this.irisRightImage = result;
        });
      }
    }
    
    // Reset input value
    inputElement.value = '';
  }

  onFingerprintMultipleSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    
    // Reset the input to allow selecting the same files again before processing
    const inputElement = event.target as HTMLInputElement;
    
    // Store which fingerprints we still need
    const neededFingerprints: string[] = [];
    if (!this.fingerprintLeftThumbImage) neededFingerprints.push('leftThumb');
    if (!this.fingerprintLeftIndexImage) neededFingerprints.push('leftIndex');
    if (!this.fingerprintLeftMiddleImage) neededFingerprints.push('leftMiddle');
    if (!this.fingerprintLeftRingImage) neededFingerprints.push('leftRing');
    if (!this.fingerprintLeftPinkyImage) neededFingerprints.push('leftPinky');
    if (!this.fingerprintRightThumbImage) neededFingerprints.push('rightThumb');
    if (!this.fingerprintRightIndexImage) neededFingerprints.push('rightIndex');
    if (!this.fingerprintRightMiddleImage) neededFingerprints.push('rightMiddle');
    if (!this.fingerprintRightRingImage) neededFingerprints.push('rightRing');
    if (!this.fingerprintRightPinkyImage) neededFingerprints.push('rightPinky');
    
    // Limit to number of needed fingerprints
    const maxFiles = Math.min(files.length, neededFingerprints.length);
    
    for (let i = 0; i < maxFiles; i++) {
      const file = files[i];
      const fingerprintType = neededFingerprints[i];
      
      switch (fingerprintType) {
        case 'leftThumb':
          this.handleFileUpload(file, (result) => {
            this.fingerprintLeftThumbImage = result;
          });
          break;
        case 'leftIndex':
          this.handleFileUpload(file, (result) => {
            this.fingerprintLeftIndexImage = result;
          });
          break;
        case 'leftMiddle':
          this.handleFileUpload(file, (result) => {
            this.fingerprintLeftMiddleImage = result;
          });
          break;
        case 'leftRing':
          this.handleFileUpload(file, (result) => {
            this.fingerprintLeftRingImage = result;
          });
          break;
        case 'leftPinky':
          this.handleFileUpload(file, (result) => {
            this.fingerprintLeftPinkyImage = result;
          });
          break;
        case 'rightThumb':
          this.handleFileUpload(file, (result) => {
            this.fingerprintRightThumbImage = result;
          });
          break;
        case 'rightIndex':
          this.handleFileUpload(file, (result) => {
            this.fingerprintRightIndexImage = result;
          });
          break;
        case 'rightMiddle':
          this.handleFileUpload(file, (result) => {
            this.fingerprintRightMiddleImage = result;
          });
          break;
        case 'rightRing':
          this.handleFileUpload(file, (result) => {
            this.fingerprintRightRingImage = result;
          });
          break;
        case 'rightPinky':
          this.handleFileUpload(file, (result) => {
            this.fingerprintRightPinkyImage = result;
          });
          break;
      }
    }
    
    // Reset input value
    inputElement.value = '';
  }

  submitBiometricData(): void {
    if (!this.isSubmissionReady) {
      this.snackBar.open('Please complete all required uploads', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    const data: BiometricSubmission = {
      userData: this.userData,
      faceImage: this.faceImage || undefined,
      irisLeftImage: this.irisLeftImage || undefined,
      irisRightImage: this.irisRightImage || undefined,
      fingerprintLeftThumb: this.fingerprintLeftThumbImage || undefined,
      fingerprintLeftIndex: this.fingerprintLeftIndexImage || undefined,
      fingerprintLeftMiddle: this.fingerprintLeftMiddleImage || undefined,
      fingerprintLeftRing: this.fingerprintLeftRingImage || undefined,
      fingerprintLeftPinky: this.fingerprintLeftPinkyImage || undefined,
      fingerprintRightThumb: this.fingerprintRightThumbImage || undefined,
      fingerprintRightIndex: this.fingerprintRightIndexImage || undefined,
      fingerprintRightMiddle: this.fingerprintRightMiddleImage || undefined,
      fingerprintRightRing: this.fingerprintRightRingImage || undefined,
      fingerprintRightPinky: this.fingerprintRightPinkyImage || undefined
    };

    this.biometricService.submitBiometricData(data).subscribe({
      next: (response) => {
        this.snackBar.open('Data submitted successfully!', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.resetForm();
      },
      error: (error) => {
        this.snackBar.open('Failed to submit data. Please try again.', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        console.error('Submission error:', error);
      }
    });
  }

  private resetForm(): void {
    this.faceImage = null;
    this.irisLeftImage = null;
    this.irisRightImage = null;
    
    this.fingerprintLeftThumbImage = null;
    this.fingerprintLeftIndexImage = null;
    this.fingerprintLeftMiddleImage = null;
    this.fingerprintLeftRingImage = null;
    this.fingerprintLeftPinkyImage = null;
    this.fingerprintRightThumbImage = null;
    this.fingerprintRightIndexImage = null;
    this.fingerprintRightMiddleImage = null;
    this.fingerprintRightRingImage = null;
    this.fingerprintRightPinkyImage = null;
    
    this.progressPercentage = 0;
    this.isUploading = false;
  }
}
