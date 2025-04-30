import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface UserData {
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
}

interface BiometricSubmission {
  userData: UserData;
  faceImage?: string;
  fingerprint?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  private baseUrl = 'http://localhost:8080/api'; // adjust if needed

  constructor(private http: HttpClient) {}

  submitBiometricData(data: BiometricSubmission): Observable<any> {
    return this.http.post(`${this.baseUrl}/biometric/submit`, data).pipe(
      tap(response => console.log('Biometric data submission response:', response)),
      catchError(error => {
        console.error('Error submitting biometric data:', error);
        return throwError(() => error);
      })
    );
  }
} 