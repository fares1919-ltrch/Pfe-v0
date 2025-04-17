import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom, Observable, ReplaySubject, catchError, throwError, of } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { TokenStorageService } from "./token-storage.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
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
    return this.http.post(AUTH_API + 'auth/signin', {
      username,
      password
    }, httpOptions).pipe(
      tap((response: any) => {
        if (response.accessToken) {
          this.tokenStorageService.saveToken(response.accessToken);
          this.tokenStorageService.saveRefreshToken(response.refreshToken);
          this.tokenStorageService.saveUser(response);
        }
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

  register(username: string, email: string, password: string, roles: string[]): Observable<any> {
    return this.http.post(AUTH_API + 'auth/signup', {
      username,
      email,
      password,
      roles
    }, httpOptions).pipe(
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
    }, httpOptions);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(AUTH_API + 'password/change', {
      currentPassword,
      newPassword
    }, httpOptions);
  }

  logout(): Observable<any> {
    return this.http.post(AUTH_API + 'auth/signout', {}, httpOptions).pipe(
      tap(() => {
        this.tokenStorageService.signOut();
        this.router.navigate(['/auth/login']);
      })
    );
  }

  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post(AUTH_API + 'auth/refreshtoken', {
      refreshToken
    }, httpOptions).pipe(
      tap((response: any) => {
        if (response.accessToken) {
          this.tokenStorageService.saveToken(response.accessToken);
          this.tokenStorageService.saveRefreshToken(response.refreshToken);
        }
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

  // Handle OAuth callback from backend redirect
  handleOAuthCallback(provider: string): Observable<any> {
    // No need to pass code parameter as it's handled by backend redirect
    return this.http.get(`${AUTH_API}auth/${provider}/callback`, httpOptions).pipe(
      tap((response: any) => {
        if (response.accessToken) {
          // Clean the token if it has the Bearer prefix
          const token = response.accessToken.replace('Bearer ', '');
          this.tokenStorageService.saveToken(token);

          if (response.refreshToken) {
            this.tokenStorageService.saveRefreshToken(response.refreshToken);
          }

          if (response.user) {
            this.tokenStorageService.saveUser(response.user);
          }

          console.log(`OAuth login with ${provider} successful, token saved`);

          // Redirect based on user roles
          this.redirectBasedOnUserRoles();
        }
      }),
      catchError((error) => {
        console.error('OAuth callback error:', error);
        return throwError(() => new Error('Failed to complete OAuth authentication'));
      })
    );
  }

  // Helper method to redirect based on user roles
  private redirectBasedOnUserRoles(): void {
    const user = this.tokenStorageService.getUser();
    if (user?.roles) {
      if (user.roles.includes('ROLE_MANAGER')) {
        this.router.navigate(['/dashboard/manager']);
      } else if (user.roles.includes('ROLE_OFFICER')) {
        this.router.navigate(['/dashboard/officer']);
      } else {
        this.router.navigate(['/dashboard/citizen']);
      }
    } else {
      // Default route if no roles are found
      this.router.navigate(['/dashboard']);
    }
  }

  // Check session status
  checkSession(): Observable<any> {
    return this.http.get(`${AUTH_API}auth/session`, httpOptions).pipe(
      tap((response: any) => {
        if (response.user) {
          this.tokenStorageService.saveUser(response.user);
        }
      }),
      catchError((error) => {
        // If it's a 401 error, it means there's no active session, which is expected for new users
        if (error.status === 401) {
          console.log('No active session found, user needs to login');
          return of({ user: null });
        }
        console.error('Session check error:', error);
        return throwError(() => error);
      })
    );
  }
}
