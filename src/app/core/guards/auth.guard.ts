// core/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';

export const authGuard: CanActivateFn = (route, state) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  // Detailed token retrieval and logging
  const token = tokenStorage.getToken();
  const user = tokenStorage.getUser();

  console.group('Auth Guard Diagnostics');
  console.log('Route:', route.url);
  console.log('State:', state.url);
  console.log('Token exists:', !!token);
  console.log('Access Token:', token);
  console.log('Refresh Token:', tokenStorage.getRefreshToken());
  console.log('User Details:', user);

  // More robust token validation
  if (!token || !user) {
    console.warn('No token or user found, redirecting to login');
    console.groupEnd();

    // Clear any potentially invalid storage
    tokenStorage.signOut();

    // Redirect to login with the original attempted URL
    router.navigate(['/auth/login'], {
      queryParams: {
        returnUrl: state.url
      }
    });
    return false;
  }

  // Optional: Check token expiration if you have expiration in your token
  // This is a placeholder - you'd need to implement actual token expiration check
  const isTokenExpired = false; // Replace with actual expiration check

  if (isTokenExpired) {
    console.warn('Token expired, redirecting to login');
    console.groupEnd();

    // Clear expired token
    tokenStorage.signOut();

    router.navigate(['/auth/login']);
    return false;
  }

  // Handle multiple roles from route data
  const requiredRoles = route.data['roles'] as Array<string>;
  if (requiredRoles) {
    console.log('Required Roles:', requiredRoles);
    console.log('User Roles:', user?.roles);

    const hasRole = user?.roles?.some((role: string) => requiredRoles.includes(role));

    if (!hasRole) {
      console.warn('User does not have required roles');
      console.groupEnd();
      router.navigate(['/access-denied']);
      return false;
    }
  }

  console.log('Access Granted');
  console.groupEnd();
  return true;
};