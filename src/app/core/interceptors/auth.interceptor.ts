import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenStorageService);
  const authService = inject(AuthService);

  // Define auth endpoints that should bypass logout checks
  const authEndpoints = [
    `${environment.apiUrl}/api/auth/signin`,
    `${environment.apiUrl}/api/auth/signup`,
    `${environment.apiUrl}/api/auth/google`,
    `${environment.apiUrl}/api/auth/github`,
    `${environment.apiUrl}/api/auth/userinfo`
  ];

  // Also check for login page or OAuth callback in the browser URL
  const isLoginPage = typeof window !== 'undefined' &&
    (window.location.href.includes('/auth/login') ||
     window.location.href.includes('/auth/oauth-callback'));

  // Check URL for logout parameter which indicates explicit logout intention
  const hasLogoutParam = typeof window !== 'undefined' &&
    new URL(window.location.href).searchParams.get('logout') === 'true';

  // For login/signup requests, clear the logout flag to ensure login works
  if (authEndpoints.some(endpoint => req.url.includes(endpoint)) || isLoginPage) {
    tokenService.clearLogoutFlag();
  }

  // Check if user recently logged out or if the URL contains a logout parameter
  // Also check if the user is a Google provider user with logout flag
  const isLoggedOut = tokenService.getLogoutFlag();
  const isGoogleUser = tokenService.getProvider() === 'google';

  if ((isLoggedOut || hasLogoutParam) &&
      !authEndpoints.some(endpoint => req.url.includes(endpoint)) &&
      !isLoginPage) {
    console.log('[Auth Interceptor] User logged out or has logout parameter, skipping token handling');

    // If this is a Google user with a logout flag, force clear all tokens
    if (isGoogleUser && (isLoggedOut || hasLogoutParam)) {
      console.log('[Auth Interceptor] Google user logout detected, clearing tokens');
      tokenService.signOut();
    }

    return next(req);
  }

  // Check if we should skip authentication for this request
  const skipAuthPaths = [
    `${environment.apiUrl}/api/auth/signin`,
    `${environment.apiUrl}/api/auth/signup`,
    `${environment.apiUrl}/api/auth/refreshtoken`,
    `${environment.apiUrl}/api/auth/password/forgot`,
    `${environment.apiUrl}/api/auth/password/reset`,
    `${environment.apiUrl}/api/auth/google`,
    `${environment.apiUrl}/api/auth/github`,
    `${environment.apiUrl}/api/auth/session`,
    `${environment.apiUrl}/api/auth/validate-token`,
    `${environment.apiUrl}/api/test/all`
  ];

  // Check if the request URL matches any of the skip paths
  if (skipAuthPaths.some(path => req.url.includes(path))) {
    console.debug('[Auth Interceptor] Skipping auth for:', req.url);
    return next(req);
  }

  const token = tokenService.getToken();
  console.debug('[Auth Interceptor] Request URL:', req.url);
  console.debug('[Auth Interceptor] Request method:', req.method);

  if (!token) {
    console.warn('[Auth Interceptor] No token available');
    return next(req);
  }

  // Check token state from last validation
  const lastValidation = tokenService.getLastTokenValidation();
  const now = Date.now();

  // If token was validated less than 1 minute ago, use it without revalidating
  if (lastValidation && (now - lastValidation.timestamp < 60000) && lastValidation.valid) {
    // Token was recently validated and is valid, use it
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  // Check if token is expired by decoding
  const tokenData = tokenService.getDecodedToken();
  if (tokenData && tokenData.exp) {
    const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
    const isTokenExpired = Date.now() >= expirationTime;

    if (isTokenExpired) {
      console.warn('[Auth Interceptor] Token expired, attempting refresh');
      const refreshToken = tokenService.getRefreshToken();

      if (!refreshToken) {
        console.warn('[Auth Interceptor] No refresh token available');
        tokenService.signOut();
        return next(req);
      }

      // Attempt to refresh the token
      return authService.refreshToken(refreshToken).pipe(
        switchMap(response => {
          if (response.accessToken) {
            tokenService.saveToken(response.accessToken);
            tokenService.saveRefreshToken(response.refreshToken);

            // Save validation state
            tokenService.setLastTokenValidation({
              valid: true,
              timestamp: Date.now()
            });

            // Clone the request and add the new token
            const authReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${response.accessToken}`)
            });

            console.debug('[Auth Interceptor] Request headers after token refresh:', authReq.headers.keys());
            return next(authReq);
          } else {
            tokenService.signOut();
            return next(req);
          }
        }),
        catchError(error => {
          console.error('[Auth Interceptor] Token refresh failed:', error);
          tokenService.signOut();
          return next(req);
        })
      );
    }
  }

  // Add the token to the request
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });

  console.debug('[Auth Interceptor] Request headers after token:', authReq.headers.keys());

  // Return the request with the token and handle errors
  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // If we get a 401 error, the token might be invalid - clear everything
        console.warn('[Auth Interceptor] Received 401 error, clearing token storage');
        tokenService.signOut();
      }
      return throwError(() => error);
    })
  );
};
