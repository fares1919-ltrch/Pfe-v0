import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, catchError, throwError, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { TokenStorageService } from "./token-storage.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { CookieService } from "ngx-cookie-service";

// API endpoints constants
const API_BASE_URL = environment.apiUrl;
const AUTH_API = `${API_BASE_URL}/api/auth/`;
const PASSWORD_API = `${API_BASE_URL}/api/password/`;

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
    private router: Router,
    private cookieService: CookieService
  ) { }

  login(username: string, password: string): Observable<any> {
    console.log('Auth Service: Attempting login for user:', username);

    // Clear logout flag to ensure we can login after logout
    this.tokenStorageService.clearLogoutFlag();

    return this.http.post(
      AUTH_API + 'signin',
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
        // Return the original error object to preserve all error information
        return throwError(() => error);
      })
    );
  }

  register(username: string, email: string, password: string, roles: string[]): Observable<any> {
    return this.http.post(AUTH_API + 'signup', {
      username,
      email,
      password,
      roles
    }, httpOptions).pipe(
      catchError((error) => {
        console.error('Registration error', error);
        // Return the original error object to preserve all error information
        return throwError(() => error);
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(PASSWORD_API + 'forgot', { email }, httpOptions);
  }

  verifyResetCode(email: string, code: string): Observable<any> {
    console.log('Verifying reset code:', { email, code });
    return this.http.post(PASSWORD_API + 'verify-code', {
      email,
      code
    }, httpOptions);
  }

  resetPassword(token: string, password: string): Observable<any> {
    console.log('Resetting password with token:', token);
    console.log('Token length:', token ? token.length : 0);
    console.log('Token type:', typeof token);

    // For direct links from email, the token is in the URL
    // The backend expects the token in the request body, not in the URL path
    return this.http.post(PASSWORD_API + 'reset', {
      token,
      password
    }, httpOptions).pipe(
      tap(response => console.log('Password reset successful:', response)),
      catchError(error => {
        console.error('Password reset error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.error?.message || error.message);
        return throwError(() => error);
      })
    );
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${AUTH_API}verify-email?token=${token}`, httpOptions);
  }

  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${AUTH_API}public-resend-verification`, { email }, httpOptions);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(PASSWORD_API + 'change', {
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
      ? AUTH_API + 'google/signout'
      : AUTH_API + 'signout';

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
    return this.http.post(AUTH_API + 'refreshtoken', {
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
    const callbackEndpoint = `${AUTH_API}${provider}/callback`;
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
    return this.http.get(`${AUTH_API}session`, httpOptions).pipe(
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
    return this.http.get(`${AUTH_API}userinfo?token=${cleanToken}`, httpOptions).pipe(
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

  /**
   * Centralized logout and redirect logic for all logout buttons (header, sidebar, profile, etc.)
   * Handles Google and non-Google users, always clears tokens and cookies, and redirects appropriately.
   */
  logoutAndRedirect(currentUser: any, cookieService: CookieService, isBrowser: boolean): void {
    const provider = currentUser?.provider;
    this.logout().subscribe({
      next: () => {
        this.tokenStorageService.signOut();
        cookieService.deleteAll('/');
        if (provider === 'google' && isBrowser) {
          sessionStorage.setItem('google-logout', 'true');
          window.location.href = '/auth/login?logout=true&provider=google';
          setTimeout(() => {
            window.open('https://accounts.google.com/Logout', '_blank');
          }, 100);
        } else {
          window.location.replace('/auth/login');
        }
      },
      error: () => {
        this.tokenStorageService.signOut();
        cookieService.deleteAll('/');
        if (provider === 'google' && isBrowser) {
          sessionStorage.setItem('google-logout', 'true');
          window.location.href = '/auth/login?logout=true&provider=google';
        } else {
          window.location.replace('/auth/login');
        }
      }
    });
  }
}
