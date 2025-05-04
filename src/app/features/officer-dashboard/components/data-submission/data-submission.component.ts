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
  userId?: string; // MongoDB _id
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



  userId: string | null = null;
  appointmentId: string | null = null;
  isIdNumberReadOnly: boolean = true; // New flag to control ID Number input readonly state
  activeTab: 'face' | 'iris' | 'fingerprints' = 'face';

 

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.appointmentId = params['appointmentId'];

      console.log('userId:', this.userId);
      console.log('appointmentId:', this.appointmentId);

      if (!this.userId || !this.appointmentId) {
        // If userId or appointmentId is missing, make ID Number field editable
        this.isIdNumberReadOnly = false;
        this.userData = {
          fullName: '',
          idNumber: '',
          dateOfBirth: '',
          email: '',
          userId: undefined
        };
        console.log('No userId or appointmentId provided. ID Number field is editable.');
        return;
      }

      // Fetch user data by userId if provided
      this.userService.getUserById(this.userId).subscribe({
        next: (user) => {
          console.log('User details in data-submission:', user);
          if (user) {
            this.userData = {
              fullName: `${user.firstName} ${user.lastName}`,
              idNumber: user.identityNumber || 'N/A',
              dateOfBirth: user.birthDate ? user.birthDate.split('T')[0] : 'N/A',
              email: user.email || 'N/A',
              userId: user._id
            };
            console.log('Set user data with MongoDB ID:', this.userData);
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
    fullName: '',
    idNumber: '',
    dateOfBirth: '',
    email: '',
    userId: undefined
  };

  // New method to handle ID Number input and fetch user data
  onIdNumberInput(event: Event): void {
    const idNumber = (event.target as HTMLInputElement).value.trim();
    if (!idNumber) {
      // Reset userData if ID Number is cleared
      this.userData = {
        fullName: '',
        idNumber: '',
        dateOfBirth: '',
        email: '',
        userId: undefined
      };
      return;
    }

    // Fetch user data by ID Number
    this.userService.getUserById(idNumber).subscribe({
      next: (user) => {
        if (user) {
          this.userData = {
            fullName: `${user.firstName} ${user.lastName}`,
            idNumber: user.identityNumber || idNumber,
            dateOfBirth: user.birthDate ? user.birthDate.split('T')[0] : 'N/A',
            email: user.email || 'N/A',
            userId: user._id
          };
          this.snackBar.open('User data loaded successfully', 'Close', {
            duration: 2000,
            panelClass: 'success-snackbar'
          });
        } else {
          this.snackBar.open('No user found with this ID Number', 'Close', {
            duration: 3000,
            panelClass: 'error-snackbar'
          });
          this.userData = {
            fullName: '',
            idNumber: idNumber,
            dateOfBirth: '',
            email: '',
            userId: undefined
          };
        }
      },
      error: (error: any) => {
        console.error('Error fetching user by ID Number:', error);
        this.snackBar.open('Failed to fetch user data', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
        this.userData = {
          fullName: '',
          idNumber: idNumber,
          dateOfBirth: '',
          email: '',
          userId: undefined
        };
      }
    });
  }






  // ViewChild references for file inputs
  @ViewChild('faceInput') faceInput!: ElementRef;
  @ViewChild('irisLeftInput') irisLeftInput!: ElementRef;
  @ViewChild('irisRightInput') irisRightInput!: ElementRef;
  @ViewChild('fingerprintLeftThumbInput') fingerprintLeftThumbInput!: ElementRef;
  @ViewChild('fingerprintLeftIndexInput') fingerprintLeftIndexInput!: ElementRef;
  @ViewChild('fingerprintLeftMiddleInput') fingerprintLeftMiddleInput!: ElementRef;
  @ViewChild('fingerprintLeftRingInput') fingerprintLeftRingInput!: ElementRef;
  @ViewChild('fingerprintLeftPinkyInput') fingerprintLeftPinkyInput!: ElementRef;
  @ViewChild('fingerprintRightThumbInput') fingerprintRightThumbInput!: ElementRef;
  @ViewChild('fingerprintRightIndexInput') fingerprintRightIndexInput!: ElementRef;
  @ViewChild('fingerprintRightMiddleInput') fingerprintRightMiddleInput!: ElementRef;
  @ViewChild('fingerprintRightRingInput') fingerprintRightRingInput!: ElementRef;
  @ViewChild('fingerprintRightPinkyInput') fingerprintRightPinkyInput!: ElementRef;

  

  constructor(
    private route: ActivatedRoute,
    private biometricService: BiometricService,
    private snackBar: MatSnackBar,
    private userService: UserService,
    
  ) {}





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

  // Calculate the percentage of completion for all biometric data
  getCompletionPercentage(): number {
    const totalRequired = 12; // 1 face + 2 iris + 10 fingerprints
    let completed = 0;
    
    if (this.faceImage) completed++;
    if (this.irisLeftImage) completed++;
    if (this.irisRightImage) completed++;
    completed += this.fingerprintImagesCount;
    
    return Math.round((completed / totalRequired) * 100);
  }

  // Trigger file upload methods
  triggerFaceUpload(): void {
    this.faceInput.nativeElement.click();
  }

  triggerIrisLeftUpload(): void {
    this.irisLeftInput.nativeElement.click();
  }
  
  triggerIrisRightUpload(): void {
    this.irisRightInput.nativeElement.click();
  }

  triggerFingerprintUpload(fingerType: string): void {
    switch (fingerType) {
      case 'leftThumb': this.fingerprintLeftThumbInput.nativeElement.click(); break;
      case 'leftIndex': this.fingerprintLeftIndexInput.nativeElement.click(); break;
      case 'leftMiddle': this.fingerprintLeftMiddleInput.nativeElement.click(); break;
      case 'leftRing': this.fingerprintLeftRingInput.nativeElement.click(); break;
      case 'leftPinky': this.fingerprintLeftPinkyInput.nativeElement.click(); break;
      case 'rightThumb': this.fingerprintRightThumbInput.nativeElement.click(); break;
      case 'rightIndex': this.fingerprintRightIndexInput.nativeElement.click(); break;
      case 'rightMiddle': this.fingerprintRightMiddleInput.nativeElement.click(); break;
      case 'rightRing': this.fingerprintRightRingInput.nativeElement.click(); break;
      case 'rightPinky': this.fingerprintRightPinkyInput.nativeElement.click(); break;
    }
  }

  // Check if any fingerprints are uploaded for hand sections
  hasLeftHandFingerprints(): boolean {
    return this.fingerprintLeftThumbImage !== null || 
           this.fingerprintLeftIndexImage !== null || 
           this.fingerprintLeftMiddleImage !== null || 
           this.fingerprintLeftRingImage !== null || 
           this.fingerprintLeftPinkyImage !== null;
  }
  
  hasRightHandFingerprints(): boolean {
    return this.fingerprintRightThumbImage !== null || 
           this.fingerprintRightIndexImage !== null || 
           this.fingerprintRightMiddleImage !== null || 
           this.fingerprintRightRingImage !== null || 
           this.fingerprintRightPinkyImage !== null;
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

  // Handle individual file selection methods
  onFaceFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleFileUpload(file, (result) => {
        this.faceImage = result;
        // After successful upload, show a toast notification
        this.showToast('Face image uploaded successfully');
        // Advance to the next tab if it's the user's first upload
        if (!this.irisLeftImage && !this.irisRightImage) {
          setTimeout(() => this.activeTab = 'iris', 500);
        }
      });
    }
  }

  onIrisLeftFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleFileUpload(file, (result) => {
        this.irisLeftImage = result;
        this.showToast('Left iris image uploaded successfully');
      });
    }
    // Reset the input to allow selecting the same file again
    (event.target as HTMLInputElement).value = '';
  }
  
  onIrisRightFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleFileUpload(file, (result) => {
        this.irisRightImage = result;
        this.showToast('Right iris image uploaded successfully');
        // If both iris images are now uploaded, advance to fingerprints tab
        if (this.irisLeftImage && this.irisRightImage && this.fingerprintImagesCount === 0) {
          setTimeout(() => this.activeTab = 'fingerprints', 500);
        }
      });
    }
    // Reset the input to allow selecting the same file again
    (event.target as HTMLInputElement).value = '';
  }
  
  onFingerprintFileSelected(event: Event, fingerType: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    // Create a descriptive name for the toast notification
    let fingerName = '';
    switch (fingerType) {
      case 'leftThumb': 
        fingerName = 'Left Thumb';
        this.handleFileUpload(file, (result) => this.fingerprintLeftThumbImage = result);
        break;
      case 'leftIndex': 
        fingerName = 'Left Index';
        this.handleFileUpload(file, (result) => this.fingerprintLeftIndexImage = result);
        break;
      case 'leftMiddle': 
        fingerName = 'Left Middle';
        this.handleFileUpload(file, (result) => this.fingerprintLeftMiddleImage = result);
        break;
      case 'leftRing': 
        fingerName = 'Left Ring';
        this.handleFileUpload(file, (result) => this.fingerprintLeftRingImage = result);
        break;
      case 'leftPinky': 
        fingerName = 'Left Pinky';
        this.handleFileUpload(file, (result) => this.fingerprintLeftPinkyImage = result);
        break;
      case 'rightThumb': 
        fingerName = 'Right Thumb';
        this.handleFileUpload(file, (result) => this.fingerprintRightThumbImage = result);
        break;
      case 'rightIndex': 
        fingerName = 'Right Index';
        this.handleFileUpload(file, (result) => this.fingerprintRightIndexImage = result);
        break;
      case 'rightMiddle': 
        fingerName = 'Right Middle';
        this.handleFileUpload(file, (result) => this.fingerprintRightMiddleImage = result);
        break;
      case 'rightRing': 
        fingerName = 'Right Ring';
        this.handleFileUpload(file, (result) => this.fingerprintRightRingImage = result);
        break;
      case 'rightPinky': 
        fingerName = 'Right Pinky';
        this.handleFileUpload(file, (result) => this.fingerprintRightPinkyImage = result);
        break;
    }
    
    this.showToast(`${fingerName} fingerprint uploaded successfully`);
    
    // Reset the input to allow selecting the same file again
    (event.target as HTMLInputElement).value = '';
  }

  // Helper method to show toast notifications
  private showToast(message: string, duration: number = 2000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: 'success-snackbar'
    });
  }

  submitBiometricData(): void {
    if (!this.isSubmissionReady) {
      this.snackBar.open('Please complete all required uploads', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    // Check if we have a valid MongoDB user ID
    if (!this.userData.userId) {
      console.error('No valid user ID available. Using user data:', this.userData);
      this.snackBar.open('User ID error. Please refresh and try again.', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    console.log('Submitting biometric data for user:', this.userData);

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
        console.log('Biometric data submitted successfully:', response);
        this.snackBar.open('Biometric data submitted successfully!', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        this.resetForm();
      },
      error: (error) => {
        console.error('Submission error details:', error);
        let errorMessage = 'Failed to submit data. Please try again.';
        if (error.error && error.error.message) {
          errorMessage += ' Error: ' + error.error.message;
        }
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  private resetForm(): void {
    // Reset all biometric data
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
    
    // Reset active tab to face
    this.activeTab = 'face';
  }
}
