import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Assuming AuthService is in a similar services directory
// import { AuthService } from './auth.service'; // Uncomment and import if needed

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  // Constructor with HttpClient and potentially AuthService
  constructor(private http: HttpClient /*, private authService: AuthService*/) {}

  generateCPFDocument(citizenId: string): Observable<string> {
    // The endpoint is based on the guide, adjust if necessary
    return this.http
      .post<{ documentUrl: string }>(`/api/citizens/${citizenId}/export-cpf`, {})
      .pipe(map((response) => response.documentUrl));
  }

  downloadDocument(documentUrl: string): Observable<Blob> {
    return this.http.get(documentUrl, {
      responseType: 'blob',
    });
  }
}
