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
    }),
    withCredentials: true
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(
      private http: HttpClient,
      private tokenStorageService: TokenStorageService,
      private router: Router
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
    return this.http.post(AUTH_API + 'password/forgot', { email }, httpOptions);
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
  return this.http.post(AUTH_API + 'auth/signout', {}, httpOptions).pipe(
    tap(() => {
      this.tokenStorageService.signOut();
      this.router.navigate(['/login']);
    })
  );
}

refreshToken(refreshToken: string): Observable<any> {
  return this.http.post(AUTH_API + 'auth/refreshtoken', {
    refreshToken
  }).pipe(
    tap((response: any) => {
      this.tokenStorageService.saveToken(response.accessToken);
      this.tokenStorageService.saveRefreshToken(response.refreshToken);
    })
  );
}

// OAuth methods
initiateGoogleAuth(): void {
  window.location.href = `${AUTH_API}auth/google`;
}

initiateGithubAuth(): void {
  window.location.href = `${AUTH_API}auth/github`;
}

handleOAuthCallback(code: string, provider: string): Observable<any> {
  return this.http.get(`${AUTH_API}auth/${provider}/callback?code=${code}`, httpOptions).pipe(
    tap((response: any) => {
      // Clean token before saving (remove Bearer prefix if present)
      const cleanToken = response.accessToken.replace(/^Bearer\s+/i, '');
      this.tokenStorageService.saveToken(cleanToken);

      if (response.refreshToken) {
        this.tokenStorageService.saveRefreshToken(response.refreshToken);
      }

      this.tokenStorageService.saveUser(response);

      console.log('OAuth login successful, token saved:',
                 cleanToken.substring(0, 20) + '...');
    })
  );
}
}
