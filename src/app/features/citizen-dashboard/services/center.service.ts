import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CenterService {

  private apiUrl = 'http://localhost:8080/api/centers'; // adapte au besoin

  constructor(private http: HttpClient) {}

  getAllActiveCenters(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }}
