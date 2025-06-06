// core/guards/auth.guard.ts
/**
 * AuthGuard
 * Protects routes based on authentication and role for Sprint 1.
 * Handles token, user, and role checks, as well as special cases for profile page refresh and logout.
 */
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

  // For profile page refreshes, if we have a token, avoid immediate redirects
  // This helps prevent the login page flash during refresh
  if (state.url.includes('/profile')) {
    if (tokenStorage.getToken()) {
      console.log('Auth Guard: Profile page with token, proceeding without immediate redirect');
      // We'll still validate the token later, but won't redirect immediately
    } else {
      console.log('Auth Guard: Profile page without token, redirecting to login immediately');
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
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

  // Check if this route explicitly requires authentication
  const requiresAuth = route.data?.['requiresAuth'] === true;

  // Check if this is a page refresh (no referrer)
  const isPageRefresh = isBrowser && document.referrer === '';

  // For routes that explicitly require auth, be extra strict
  if (requiresAuth && !token) {
    console.warn('Auth Guard: Protected route requires auth but no token found');

    // If this is a page refresh, add a small delay before redirecting
    // This helps prevent the login page flash during refresh
    if (isPageRefresh) {
      console.log('Auth Guard: Adding delay before redirect during page refresh');

      // Return a promise that resolves to false after a short delay
      return new Promise<boolean>(resolve => {
        setTimeout(() => {
          // Check token again after delay in case it was refreshed
          if (!tokenStorage.getToken()) {
            tokenStorage.signOut();
            router.navigate(['/auth/login'], {
              queryParams: { returnUrl: state.url }
            });
          }
          resolve(false);
        }, 300); // 300ms delay
      });
    }

    // Normal flow for non-refresh
    tokenStorage.signOut();
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // General token check for all routes
  if (!token) {
    console.warn('Auth Guard: No token found, redirecting to login');

    // If this is a page refresh, add a small delay before redirecting
    if (isPageRefresh) {
      console.log('Auth Guard: Adding delay before redirect during page refresh');

      // Return a promise that resolves to false after a short delay
      return new Promise<boolean>(resolve => {
        setTimeout(() => {
          // Check token again after delay in case it was refreshed
          if (!tokenStorage.getToken()) {
            tokenStorage.signOut();
            router.navigate(['/auth/login'], {
              queryParams: { returnUrl: state.url }
            });
          }
          resolve(false);
        }, 300); // 300ms delay
      });
    }

    // Normal flow for non-refresh
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

      // For profile pages, we'll be more lenient to avoid login flashes
      const isProfilePage = state.url.includes('/profile');

      // If this is a profile page, proceed with token validation in the background
      // but don't block navigation or redirect to login immediately
      if (isProfilePage) {
        console.log('Auth Guard: Profile page detected, proceeding with background validation');
        // Start user info fetch in background but don't wait for it
        authService.getUserInfo(token).subscribe({
          next: (userInfo) => {
            if (userInfo && userInfo.id) {
              console.log('Auth Guard: Successfully retrieved user info in background');
              tokenStorage.saveUser(userInfo);
            }
          },
          error: (error) => {
            console.error('Auth Guard: Background user info fetch failed:', error);
            // Don't sign out or redirect here - let the interceptor handle it if needed
          }
        });

        // Allow navigation to proceed
        return true;
      }

      // For non-profile pages, use the normal validation flow
      const userInfo = await firstValueFrom(authService.getUserInfo(token));
      if (userInfo && userInfo.id) {
        console.log('Auth Guard: Successfully retrieved user info');
        tokenStorage.saveUser(userInfo);
        return true;
      } else {
        console.warn('Auth Guard: Failed to get valid user info');

        // Try to redirect based on roles first
        try {
          authService.redirectBasedOnUserRoles();
          return true;
        } catch (e) {
          console.error('Auth Guard: Failed to redirect based on roles', e);
          tokenStorage.signOut();
          router.navigate(['/auth/login']);
          return false;
        }
      }
    } catch (error) {
      console.error('Auth Guard: Error getting user info:', error);

      // For profile pages, still allow navigation even on error
      if (state.url.includes('/profile')) {
        console.log('Auth Guard: Allowing profile navigation despite error');
        return true;
      }

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
      const isProfilePage = state.url.includes('/profile');

      if (!refreshToken) {
        console.warn('Auth Guard: No refresh token available');

        // For profile pages, be more lenient
        if (isProfilePage) {
          console.log('Auth Guard: Profile page with expired token but no refresh token');
          console.log('Auth Guard: Allowing navigation to proceed anyway');
          // We'll let the interceptor handle the redirect if needed
          return true;
        }

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

        // For profile pages, still allow navigation even on refresh failure
        if (isProfilePage) {
          console.log('Auth Guard: Allowing profile navigation despite token refresh failure');
          return true;
        }

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

    // For profile pages, we'll be more lenient with session checks during page refreshes
    const isProfilePage = state.url.includes('/profile');
    const isPageRefresh = isBrowser && document.referrer === '';

    // Skip session check for profile pages during refresh to avoid login page flash
    if (!skipSessionCheck && !(isProfilePage && isPageRefresh)) {
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
