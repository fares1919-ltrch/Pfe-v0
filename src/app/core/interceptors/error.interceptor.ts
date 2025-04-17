import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`[Error Interceptor] Error occurred:`, error);

      // Handle authentication errors
      if (error.status === 401) {
        console.warn('Authentication error detected, attempting token refresh');

        // Check if it's a token expiration error
        if (error.error?.error?.message?.includes('token has expired')) {
          const refreshToken = tokenStorage.getRefreshToken();
          if (refreshToken) {
            // Attempt to refresh the token
            authService.refreshToken(refreshToken).subscribe({
              next: (response) => {
                if (response.accessToken) {
                  tokenStorage.saveToken(response.accessToken);
                  tokenStorage.saveRefreshToken(response.refreshToken);
                  // Retry the original request
                  const clonedReq = req.clone({
                    headers: req.headers.set('Authorization', `Bearer ${response.accessToken}`),
                    withCredentials: true
                  });
                  return next(clonedReq);
                }
              },
              error: (refreshError) => {
                console.error('Token refresh failed:', refreshError);
                tokenStorage.signOut();
                router.navigate(['/auth/login'], {
                  queryParams: { returnUrl: router.url }
                });
              }
            });
          } else {
            tokenStorage.signOut();
            router.navigate(['/auth/login'], {
              queryParams: { returnUrl: router.url }
            });
          }
        } else {
          // Other 401 errors
          tokenStorage.signOut();
          router.navigate(['/auth/login'], {
            queryParams: { returnUrl: router.url }
          });
        }
      } else if (error.status === 403) {
        // Handle forbidden errors
        console.warn('Forbidden error detected, redirecting to access denied page');
        router.navigate(['/access-denied']);
      } else if (error.status === 404) {
        // Handle not found errors
        console.warn('Resource not found:', req.url);
      } else if (error.status === 409) {
        // Handle conflict errors (e.g., duplicate entries)
        console.warn('Conflict error:', error.error?.error?.message);
      } else if (error.status === 500) {
        // Handle server errors
        console.error('Server error:', error.error?.error?.message);
      } else if (error.status === 503) {
        // Handle service unavailable errors
        console.error('Service unavailable:', error.error?.error?.message);
      }

      // Extract error message from backend response
      let errorMessage = 'An unexpected error occurred';
      if (error.error?.error?.message) {
        // Backend format: { success: false, error: { message: '...' } }
        errorMessage = error.error.error.message;
      } else if (error.error?.message) {
        // Alternative backend format
        errorMessage = error.error.message;
      } else if (error.message) {
        // Fallback to error message
        errorMessage = error.message;
      }

      // Return a standardized error object
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        error: error.error
      }));
    })
  );
};
