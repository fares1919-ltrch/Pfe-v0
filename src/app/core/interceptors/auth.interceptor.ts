import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenStorageService);
  const authService = inject(AuthService);

  // Skip token only for specific auth endpoints (login, register, forgot password)
  const skipAuthPaths = [
    `${environment.apiUrl}/api/auth/signin`,
    `${environment.apiUrl}/api/auth/signup`,
    `${environment.apiUrl}/api/auth/password/forgot`
  ];

  if (skipAuthPaths.some(path => req.url.includes(path))) {
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
  if (tokenData && tokenData.exp && tokenData.exp * 1000 < Date.now()) {
    console.debug('[Auth Interceptor] Token expired, attempting refresh');
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      authService.logout().subscribe();
      return throwError(() => new Error('No refresh token available'));
    }

    return authService.refreshToken(refreshToken).pipe(
      switchMap((newToken) => {
        console.debug('[Auth Interceptor] Token refreshed successfully');
        const clonedReq = addTokenToRequest(req, newToken.accessToken);
        return next(clonedReq);
      }),
      catchError((error) => {
        console.error('[Auth Interceptor] Token refresh failed:', error);
        tokenService.signOut();
        return throwError(() => error);
      })
    );
  }

  const clonedReq = addTokenToRequest(req, token);
  console.debug('[Auth Interceptor] Request headers after token:', clonedReq.headers.keys());

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.debug('[Auth Interceptor] 401 error, signing out');
        tokenService.signOut();
      }
      return throwError(() => error);
    })
  );
};

function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
}
