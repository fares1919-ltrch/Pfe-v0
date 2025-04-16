import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Center {
  id: string;
  name: string;
  region: string;
  address: string;
  capacity: number;
  workingHours: {
    start: string;
    end: string;
  };
  lat: number;
  lon: number;
}

interface CentersResponse {
  centers: Center[];
}

@Injectable({
  providedIn: 'root'
})
export class CenterService {
  private apiUrl = `${environment.apiUrl}/api/centers`;

  constructor(private http: HttpClient) {}

  getAllActiveCenters(): Observable<CentersResponse> {
    return this.http.get<CentersResponse>(this.apiUrl, {
      withCredentials: true
    });
  }
}
