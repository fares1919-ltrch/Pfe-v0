import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenStorageService);
  const authService = inject(AuthService);

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

  // Check if token is expired
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
  return next(authReq);
};
