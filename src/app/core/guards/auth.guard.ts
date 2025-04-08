// core/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';

export const authGuard: CanActivateFn = (route, state) => {
  const tokenStorage = inject(TokenStorageService);
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
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
    const isTokenExpired = Date.now() >= expirationTime;

    if (isTokenExpired) {
      console.warn('Auth Guard: Token expired, redirecting to login');
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
