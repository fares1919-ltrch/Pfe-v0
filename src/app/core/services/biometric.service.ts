import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface UserData {
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  email: string;
  userId?: string; // MongoDB _id of the user
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

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  private baseUrl = 'http://localhost:8080/api'; // adjust if needed

  constructor(private http: HttpClient) {}

  submitBiometricData(data: BiometricSubmission): Observable<any> {
    // Create a FormData object to properly handle file uploads
    const formData = new FormData();
    
    // Add user data - use the MongoDB userId if available, otherwise use identityNumber
    if (data.userData.userId) {
      formData.append('userId', data.userData.userId);
      console.log('Using MongoDB user ID:', data.userData.userId);
    } else {
      formData.append('userId', data.userData.idNumber);
      console.warn('Using identity number as userId. This might cause issues if MongoDB expects an ObjectId.');
    }
    
    // Add biometric data with proper naming convention
    if (data.faceImage) {
      const faceFile = this.dataURLtoFile(data.faceImage, 'face.png');
      formData.append('imageFace', faceFile);
    }
    
    if (data.irisLeftImage) {
      const irisLeftFile = this.dataURLtoFile(data.irisLeftImage, 'iris-left.png');
      formData.append('imageIrisLeft', irisLeftFile);
    }
    
    if (data.irisRightImage) {
      const irisRightFile = this.dataURLtoFile(data.irisRightImage, 'iris-right.png');
      formData.append('imageIrisRight', irisRightFile);
    }
    
    // Add fingerprints with proper naming convention
    if (data.fingerprintLeftThumb) {
      const leftThumbFile = this.dataURLtoFile(data.fingerprintLeftThumb, 'left-thumb.png');
      formData.append('imageFingerprintLeftThumb', leftThumbFile);
    }
    
    if (data.fingerprintLeftIndex) {
      const leftIndexFile = this.dataURLtoFile(data.fingerprintLeftIndex, 'left-index.png');
      formData.append('imageFingerprintLeftIndex', leftIndexFile);
    }
    
    if (data.fingerprintLeftMiddle) {
      const leftMiddleFile = this.dataURLtoFile(data.fingerprintLeftMiddle, 'left-middle.png');
      formData.append('imageFingerprintLeftMiddle', leftMiddleFile);
    }
    
    if (data.fingerprintLeftRing) {
      const leftRingFile = this.dataURLtoFile(data.fingerprintLeftRing, 'left-ring.png');
      formData.append('imageFingerprintLeftRing', leftRingFile);
    }
    
    if (data.fingerprintLeftPinky) {
      const leftPinkyFile = this.dataURLtoFile(data.fingerprintLeftPinky, 'left-pinky.png');
      formData.append('imageFingerprintLeftLittle', leftPinkyFile);
    }
    
    if (data.fingerprintRightThumb) {
      const rightThumbFile = this.dataURLtoFile(data.fingerprintRightThumb, 'right-thumb.png');
      formData.append('imageFingerprintRightThumb', rightThumbFile);
    }
    
    if (data.fingerprintRightIndex) {
      const rightIndexFile = this.dataURLtoFile(data.fingerprintRightIndex, 'right-index.png');
      formData.append('imageFingerprintRightIndex', rightIndexFile);
    }
    
    if (data.fingerprintRightMiddle) {
      const rightMiddleFile = this.dataURLtoFile(data.fingerprintRightMiddle, 'right-middle.png');
      formData.append('imageFingerprintRightMiddle', rightMiddleFile);
    }
    
    if (data.fingerprintRightRing) {
      const rightRingFile = this.dataURLtoFile(data.fingerprintRightRing, 'right-ring.png');
      formData.append('imageFingerprintRightRing', rightRingFile);
    }
    
    if (data.fingerprintRightPinky) {
      const rightPinkyFile = this.dataURLtoFile(data.fingerprintRightPinky, 'right-pinky.png');
      formData.append('imageFingerprintRightLittle', rightPinkyFile);
    }

    return this.http.post(`${this.baseUrl}/biometrics`, formData).pipe(
      tap(response => console.log('Biometric data submission response:', response)),
      catchError(error => {
        console.error('Error submitting biometric data:', error);
        if (error.error && error.error.message) {
          console.error('Server error message:', error.error.message);
        }
        return throwError(() => error);
      })
    );
  }
  
  // Convert Data URL to File object
  private dataURLtoFile(dataurl: string, filename: string): File {
    if (!dataurl) {
      throw new Error('Invalid data URL');
    }
    
    const arr = dataurl.split(',');
    if (arr.length < 2) {
      throw new Error('Invalid data URL format');
    }
    
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }
} 