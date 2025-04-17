// core/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = tokenStorage.getToken();
  const user = tokenStorage.getUser();

  if (!token || !user) {
    console.warn('Auth Guard: No token or user found, redirecting to login');
    tokenStorage.signOut();
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check token expiration
  try {
    const tokenPayload = tokenStorage.getDecodedToken();
    if (!tokenPayload || !tokenPayload.exp) {
      throw new Error('Invalid token payload');
    }

    const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
    const isTokenExpired = Date.now() >= expirationTime;

    if (isTokenExpired) {
      console.warn('Auth Guard: Token expired, attempting refresh');
      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        console.warn('Auth Guard: No refresh token available, redirecting to login');
        tokenStorage.signOut();
        router.navigate(['/auth/login']);
        return false;
      }

      try {
        // Attempt to refresh the token
        const response = await firstValueFrom(authService.refreshToken(refreshToken));
        if (response.accessToken) {
          tokenStorage.saveToken(response.accessToken);
          tokenStorage.saveRefreshToken(response.refreshToken);
          return true;
        }
      } catch (error) {
        console.error('Auth Guard: Token refresh failed', error);
        tokenStorage.signOut();
        router.navigate(['/auth/login']);
        return false;
      }
    }

    // Check session status with backend
    try {
      await firstValueFrom(authService.checkSession());
    } catch (error) {
      console.error('Auth Guard: Session check failed', error);
      // If session check fails, try to refresh token
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await firstValueFrom(authService.refreshToken(refreshToken));
          if (response.accessToken) {
            tokenStorage.saveToken(response.accessToken);
            tokenStorage.saveRefreshToken(response.refreshToken);
            return true;
          }
        } catch (refreshError) {
          console.error('Auth Guard: Token refresh failed after session check', refreshError);
        }
      }
      tokenStorage.signOut();
      router.navigate(['/auth/login']);
      return false;
    }
  } catch (error) {
    console.error('Auth Guard: Error checking token expiration', error);
    tokenStorage.signOut();
    router.navigate(['/auth/login']);
    return false;
  }

  // Check roles if required
  const requiredRoles = route.data['roles'] as Array<string>;
  if (requiredRoles?.length > 0) {
    const hasRole = user?.roles?.some((role: string) => requiredRoles.includes(role));
    if (!hasRole) {
      console.warn('Auth Guard: User does not have required roles');
      router.navigate(['/access-denied']);
      return false;
    }
  }

  return true;
};
