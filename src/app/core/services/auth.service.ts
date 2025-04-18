import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom, Observable, ReplaySubject, catchError, throwError, of } from 'rxjs';
import { filter, tap, map } from 'rxjs/operators';
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
    console.log('Auth Service: Attempting login for user:', username);

    // Clear logout flag to ensure we can login after logout
    this.tokenStorageService.clearLogoutFlag();

    return this.http.post(
      AUTH_API + 'auth/signin',
      {
        username,
        password,
      },
      httpOptions
    ).pipe(
      tap((data: any) => {
        if (data.accessToken) {
          console.log('Auth Service: Login successful, saving tokens');
          this.tokenStorageService.saveToken(data.accessToken);

          if (data.refreshToken) {
            this.tokenStorageService.saveRefreshToken(data.refreshToken);
          }

          this.tokenStorageService.saveUser(data);
        }
      }),
      catchError(error => {
        console.error('Auth Service: Login error:', error);
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
    console.log('Auth Service: Logging out...');

    // Prepare for logout by caching current state
    const currentToken = this.tokenStorageService.getToken();
    const refreshToken = this.tokenStorageService.getRefreshToken();
    const provider = this.tokenStorageService.getProvider();

    // Create custom headers with the token for the server to recognize the session
    const logoutHeaders = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'x-access-token': currentToken || ''
      }),
      withCredentials: true
    };

    console.log('Auth Service: Sending logout request with token in headers');

    // For Google users, use the special Google logout endpoint
    const logoutEndpoint = provider === 'google'
      ? AUTH_API + 'auth/google/signout'
      : AUTH_API + 'auth/signout';

    // Send the refresh token in the request body for server-side invalidation
    return this.http.post(logoutEndpoint, { refreshToken }, logoutHeaders).pipe(
      tap(() => {
        console.log('Auth Service: Server-side logout successful');
        // Clear all tokens and user data from storage
        this.tokenStorageService.signOut();
      }),
      catchError(error => {
        console.error('Auth Service: Logout error:', error);
        // Even if server-side logout fails, clear local storage
        this.tokenStorageService.signOut();
        return of({ success: false, error: error.message });
      })
    );
  }

  refreshToken(refreshToken: string): Observable<any> {
    console.log('Attempting to refresh token');
    return this.http.post(AUTH_API + 'auth/refreshtoken', {
      refreshToken
    }, httpOptions).pipe(
      tap((response: any) => {
        if (response.accessToken) {
          console.log('Token refresh successful, saving new tokens');
          this.tokenStorageService.saveToken(response.accessToken);
          if (response.refreshToken) {
            this.tokenStorageService.saveRefreshToken(response.refreshToken);
          }
        } else {
          console.warn('Token refresh response missing accessToken');
        }
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        return throwError(() => new Error(error.error?.message || 'Token refresh failed'));
      })
    );
  }

  // OAuth methods
  initiateGoogleAuth(): void {
    // Clear logout flag before redirecting to Google auth
    this.tokenStorageService.clearLogoutFlag();

    // Use redirect to the backend OAuth endpoint
    const redirectUrl = `${environment.apiUrl}/api/auth/google`;
    console.log('Redirecting to Google OAuth:', redirectUrl);
    window.location.href = redirectUrl;
  }

  /* Commenting out GitHub authentication as requested
  initiateGithubAuth(): void {
    // Clear logout flag before redirecting to GitHub auth
    this.tokenStorageService.clearLogoutFlag();

    // Use redirect to the backend OAuth endpoint
    const redirectUrl = `${environment.apiUrl}/api/auth/github`;
    console.log('Redirecting to GitHub OAuth:', redirectUrl);
    window.location.href = redirectUrl;
  }
  */

  // Handle OAuth callback
  handleOAuthCallback(provider: string): Observable<any> {
    const callbackEndpoint = `${AUTH_API}auth/${provider}/callback`;
    console.log(`Completing OAuth flow for ${provider} at ${callbackEndpoint}`);

    // Use a custom HTTP options to explicitly allow credentials and JSON response
    const callbackOptions = {
      ...httpOptions,
      observe: 'response' as const,
      responseType: 'json' as const
    };

    return this.http.get(callbackEndpoint, callbackOptions).pipe(
      tap(response => {
        console.log(`OAuth callback response:`, response);
      }),
      // Extract the body from the response
      map((response: any) => response.body),
      tap((data: any) => {
        if (data && data.accessToken) {
          this.tokenStorageService.saveToken(data.accessToken);
          if (data.refreshToken) {
            this.tokenStorageService.saveRefreshToken(data.refreshToken);
          }
          this.tokenStorageService.saveUser(data);
        }
      }),
      catchError(error => {
        console.error(`${provider} OAuth callback error:`, error);
        return throwError(() => new Error(`Failed to complete ${provider} authentication: ${error.message}`));
      })
    );
  }

  // Helper method to redirect based on user roles
  redirectBasedOnUserRoles(): void {
    const user = this.tokenStorageService.getUser();
    if (user?.roles) {
      if (user.roles.includes('ROLE_MANAGER')) {
        this.router.navigate(['/manager-dashboard']);
      } else if (user.roles.includes('ROLE_OFFICER')) {
        this.router.navigate(['/officer-dashboard']);
      } else {
        this.router.navigate(['/citizen-dashboard']);
      }
    } else {
      // Default route if no roles are found
      this.router.navigate(['/profile']);
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

        // If it's a network error or other fetch error, return the token info we have
        if (error.status === 0) {
          console.warn('Network error during session check, using stored token');
          const token = this.tokenStorageService.getToken();
          const user = this.tokenStorageService.getUser();

          if (token && user) {
            return of(user);
          }
        }

        console.error('Session check error:', error);
        return of({ user: null });
      })
    );
  }

  // Get user info with token - better for OAuth callbacks
  getUserInfo(token?: string): Observable<any> {
    const currentToken = token || this.tokenStorageService.getToken();

    if (!currentToken) {
      console.warn('Auth Service: No token available for getUserInfo');
      return of({ user: null });
    }

    console.log('Auth Service: Getting user info with token');

    // Clean the token before using it
    const cleanToken = currentToken.replace(/^Bearer\s+/i, '');

    // Use token as URL parameter for better cross-platform compatibility
    return this.http.get(`${AUTH_API}auth/userinfo?token=${cleanToken}`, httpOptions).pipe(
      tap((user: any) => {
        console.log('Auth Service: User info received successfully');
        // Save user info to storage
        if (user && user.id) {
          this.tokenStorageService.saveUser(user);
        }
      }),
      catchError((error) => {
        console.error('Auth Service: Error getting user info:', error);
        // If user info fetch fails but we have a token, return a minimal user object
        // to allow the user to access protected pages
        if (error.status === 0) {
          console.warn('Auth Service: Network error, returning default user');
          return of({
            id: 'offline-user',
            username: 'User',
            roles: ['ROLE_USER'],
            isOfflineUser: true
          });
        }

        if (error.status === 401) {
          // Token is invalid or expired
          console.warn('Auth Service: Token is invalid or expired, signing out');
          this.tokenStorageService.signOut();
          this.router.navigate(['/auth/login']);
        }

        return of({ id: 'unknown', username: 'User', roles: ['ROLE_USER'] });
      })
    );
  }
}
