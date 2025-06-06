import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface SimulationResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CpfSimulationService {

  constructor() { }

  // Simulate API call with random success/failure
  private simulateApiCall(successRate: number = 0.8): Observable<SimulationResponse> {
    const isSuccess = Math.random() < successRate;
    const delay_time = Math.random() * 2000 + 500; // 500ms to 2.5s delay

    if (isSuccess) {
      return of({
        success: true,
        message: 'Operation completed successfully',
        data: { timestamp: new Date() }
      }).pipe(delay(delay_time));
    } else {
      return throwError(() => ({
        success: false,
        message: 'Operation failed. Please try again later.',
        error: 'SIMULATION_ERROR'
      })).pipe(delay(delay_time));
    }
  }

  // CPF Pending Actions
  cancelCpfRequest(): Observable<SimulationResponse> {
    return this.simulateApiCall(0.9).pipe(
      map(response => ({
        ...response,
        message: 'CPF request cancelled successfully'
      }))
    );
  }

  updateAppointment(newDate: Date): Observable<SimulationResponse> {
    return this.simulateApiCall(0.85).pipe(
      map(response => ({
        ...response,
        message: 'Appointment updated successfully',
        data: { newDate }
      }))
    );
  }

  deleteAppointment(): Observable<SimulationResponse> {
    return this.simulateApiCall(0.9).pipe(
      map(response => ({
        ...response,
        message: 'Appointment deleted successfully'
      }))
    );
  }

  // CPF Generated Actions
  requestConsultingDemand(comment: string): Observable<SimulationResponse> {
    return this.simulateApiCall(0.75).pipe(
      map(response => ({
        ...response,
        message: 'Consulting demand submitted successfully',
        data: { 
          requestId: 'REQ-' + Date.now(),
          comment,
          estimatedResponse: '3-5 business days'
        }
      }))
    );
  }

  downloadCpfDocument(): Observable<SimulationResponse> {
    return this.simulateApiCall(0.95).pipe(
      map(response => ({
        ...response,
        message: 'CPF document downloaded successfully'
      }))
    );
  }

  // CPF Fraud Actions
  contestFraud(contestReason: string, evidence?: File[]): Observable<SimulationResponse> {
    return this.simulateApiCall(0.7).pipe(
      map(response => ({
        ...response,
        message: 'Fraud contest submitted successfully',
        data: {
          contestId: 'CONTEST-' + Date.now(),
          reason: contestReason,
          evidenceCount: evidence?.length || 0,
          estimatedReview: '7-14 business days'
        }
      }))
    );
  }

  // Utility method to simulate different error scenarios
  simulateSpecificError(errorType: 'network' | 'server' | 'validation' | 'timeout'): Observable<never> {
    let errorMessage = '';
    
    switch (errorType) {
      case 'network':
        errorMessage = 'Network connection failed. Please check your internet connection.';
        break;
      case 'server':
        errorMessage = 'Server is temporarily unavailable. Please try again later.';
        break;
      case 'validation':
        errorMessage = 'Invalid data provided. Please check your input and try again.';
        break;
      case 'timeout':
        errorMessage = 'Request timed out. Please try again.';
        break;
    }

    return throwError(() => ({
      success: false,
      message: errorMessage,
      error: errorType.toUpperCase() + '_ERROR'
    })).pipe(delay(1000));
  }
}
