import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`[Error Interceptor] Error occurred:`, error);

      if ([401, 403].includes(error.status)) {
        // Handle authentication errors
        console.warn('Authentication error detected, logging out user');
        tokenStorage.signOut();
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url }
        });
      }

      // Customize error message based on status code
      let errorMessage = 'An unexpected error occurred';
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 404) {
        errorMessage = 'Resource not found';
      } else if (error.status === 400) {
        errorMessage = 'Bad request';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error';
      }

      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        error: error.error
      }));
    })
  );
};
