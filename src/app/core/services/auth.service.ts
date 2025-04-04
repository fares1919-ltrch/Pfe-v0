import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom, Observable, ReplaySubject, catchError, throwError } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { TokenStorageService } from "./token-storage.service";
import {HttpClient,HttpHeaders} from "@angular/common/http";
import { environment } from "../../../environments/environment";

const AUTH_API = `${environment.apiUrl}/api/`;

const httpOptions = {
    headers: new HttpHeaders({
        'Content-Type': 'application/json'
    })
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(
      private http: HttpClient,
      private tokenStorageService: TokenStorageService
    ) { }

    login(username: string, password: string): Observable<any> {
        console.log('Attempting login with:', { username, apiUrl: AUTH_API + 'auth/signin' });
        return this.http.post(AUTH_API + 'auth/signin',{
            username,
            password
        },{
            withCredentials: true,
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).pipe(
          // Store tokens after successful login
          tap((response: any) => {
            this.tokenStorageService.saveToken(response.accessToken);
            this.tokenStorageService.saveRefreshToken(response.refreshToken);
            this.tokenStorageService.saveUser(response);
          }),
            catchError((error) => {
                console.error('Login error details:', {
                    status: error.status,
                    message: error.message,
                    errorObject: error,
                    errorBody: error.error
                });
                return throwError(() => new Error(error.error?.message || 'Login failed'));
            })
        );
    }
    register (username: string , email: string ,password: string,roles: string[]): Observable<any> {
      return this.http.post(AUTH_API + 'auth/signup',{
          username,
          email,
          password,
          roles
      }, {
          withCredentials: true,
          headers: new HttpHeaders({
              'Content-Type': 'application/json'
          })
      }).pipe(
          catchError((error) => {
              console.error('Registration error', error);
              return throwError(() => new Error(error.error?.message || 'Registration failed'));
          })
      );
  }
  forgotPassword(email: string): Observable<any> {
    return this.http.post(AUTH_API + 'password/forgot', { email });
}

resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(AUTH_API + 'password/reset', {
        token,
        password
    });

}

changePassword(currentPassword: string, newPassword: string): Observable<any> {
  return this.http.post(AUTH_API + 'password/change', {
    currentPassword,
    newPassword
  }, { withCredentials: true });
}

logout(): Observable<any> {
  return this.http.post(AUTH_API + 'auth/signout', {}); // New logout endpoint
}

refreshToken(refreshToken: string): Observable<any> {
  return this.http.post(AUTH_API + 'auth/refreshtoken', {
    refreshToken
  });
}
}
