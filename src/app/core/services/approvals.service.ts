import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface VerifyResponse {
  success: boolean;
  message: string;
}

interface VerifyRequest {
  dateTime: string;  // Combined date and time
}

// Represents a day with its available slots as returned by the API
interface AvailableDayItem {
  date: string;
  availableSlots: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApprovalsService {
  private baseUrl = 'http://localhost:8080/api'; // adjust if needed

  constructor(private http: HttpClient) {}

  GetPendingAndApprovedReq(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cpf-requests/PendingAndApprovedReq`);
  }

  getAvailableDays(centerId: string): Observable<AvailableDayItem[]> {
    return this.http.get<AvailableDayItem[]>(`${this.baseUrl}/centers/${centerId}/available-days`)
      .pipe(
        tap(response => console.log(`Received available days for center ${centerId}:`, response)),
        catchError(error => {
          console.error(`Error fetching available days for center ${centerId}:`, error);
          return throwError(() => error);
        })
      );
  }

  verifyRequest(requestId: string, meetingDate: Date): Observable<any> {
    const dateTime = this.formatDateTime(meetingDate);
    
    console.log(`Verifying request ${requestId} with date: ${dateTime}`);
    console.log("dateeeeeeeeeeeeeeeeeeee" , dateTime)
    
    return this.http.post<any>(`${this.baseUrl}/appointments/createScheduleAppointment/${requestId}`, {
      date : dateTime
    }).pipe(
      tap(response => console.log('Verify response:', response)),
      catchError(error => {
        console.error('Error verifying request:', error);
        return throwError(() => error);
      })
    );
  }

  rescheduleRequest(requestId: string, newDate: Date): Observable<any> {
    const date = this.formatDateTime(newDate); // format as yyyy-mm-dd
    return this.http.put<any>(`${this.baseUrl}/appointments/reschedule/${requestId}`, { date });
  }

  private formatDateTime(date: Date): string {
    if (!date) {
      return '';
    }
    
    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Return only the date part
    return `${year}-${month}-${day}`;
  }
}
