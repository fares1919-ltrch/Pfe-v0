// core/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authGuard: CanActivateFn = async (route, state) => {
  console.log('Auth Guard: Checking authentication...');
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // Check if we're in the login page - if so, allow it without further checks
  if (state.url.includes('/auth/login')) {
    // Clear the logout flag when on login page to ensure users can log in
    tokenStorage.clearLogoutFlag();
    return true;
  }

  // Check for recent logout flag
  const recentlyLoggedOut = tokenStorage.getLogoutFlag();
  if (recentlyLoggedOut) {
    console.log('Auth Guard: User recently logged out, preventing auto-reconnection');
    tokenStorage.signOut(); // Clear any remaining tokens
    router.navigate(['/auth/login']);
    return false;
  }

  // Only check URL parameters if in browser environment
  if (isBrowser) {
    // Check for logout=true URL parameter
    const url = new URL(window.location.href);
    if (url.searchParams.get('logout') === 'true') {
      console.log('Auth Guard: Logout parameter detected, redirecting to login');
      // Always clear tokens when logout parameter is present
      tokenStorage.signOut();
      router.navigate(['/auth/login']);
      return false;
    }

    // Special handling for Google users - ensure complete logout
    const provider = tokenStorage.getProvider();
    if (provider === 'google' && url.searchParams.get('logout') === 'true') {
      console.log('Auth Guard: Google user with logout parameter, ensuring complete logout');
      tokenStorage.signOut();
      router.navigate(['/auth/login']);
      return false;
    }
  }

  const token = tokenStorage.getToken();
  const user = tokenStorage.getUser();

  console.log('Auth Guard: Token found:', !!token);
  console.log('Auth Guard: User found:', !!user);

  if (!token) {
    console.warn('Auth Guard: No token found, redirecting to login');
    tokenStorage.signOut();
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // If we have a token but no user data, try to get user info
  if (token && !user) {
    try {
      console.log('Auth Guard: We have token but no user, fetching user info');
      const userInfo = await firstValueFrom(authService.getUserInfo(token));
      if (userInfo && userInfo.id) {
        console.log('Auth Guard: Successfully retrieved user info');
        tokenStorage.saveUser(userInfo);
        return true;
      } else {
        console.warn('Auth Guard: Failed to get valid user info');
        tokenStorage.signOut();
        router.navigate(['/auth/login']);
        return false;
      }
    } catch (error) {
      console.error('Auth Guard: Error getting user info:', error);
      tokenStorage.signOut();
      router.navigate(['/auth/login']);
      return false;
    }
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

    // Check session status with backend - skip for OAuth redirects and profile pages
    // to avoid unnecessary session validation that could cause unwanted logouts
    const skipSessionCheck =
      state.url.includes('/auth/oauth-callback') ||
      state.url.includes('/profile');

    if (!skipSessionCheck) {
      try {
        console.log('Auth Guard: Checking session with backend');
        await firstValueFrom(authService.getUserInfo());
      } catch (error) {
        // Handle network errors gracefully without logging out
        if (typeof error === 'object' && error !== null && 'status' in error && error.status === 0) {
          console.warn('Auth Guard: Network error during session check, proceeding anyway');
          return true;
        }

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

        // If token is valid but session check fails, try to continue anyway (offline mode)
        if (!isTokenExpired && user) {
          console.log('Auth Guard: Session check failed but token is still valid, proceeding');
          return true;
        }

        tokenStorage.signOut();
        router.navigate(['/auth/login']);
        return false;
      }
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

  console.log('Auth Guard: Authentication successful');
  return true;
};
