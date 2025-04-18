import { Injectable, Inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { CookieService } from 'ngx-cookie-service';

const TOKEN_KEY = "auth-token";
const USER_KEY = "auth-user";
const REFRESH_TOKEN_KEY = "refreshToken";
const LOGOUT_FLAG_KEY = "recently-logged-out";

interface DecodedToken {
  exp?: number;
  [key: string]: any;
}

// Interface for token validation status
interface TokenValidationStatus {
  valid: boolean;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'  // Ensure service is provided at root level
})
export class TokenStorageService {
  private isBrowser: boolean;
  private static TOKEN_VALIDATION_KEY = 'token-validation-status';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cookieService: CookieService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  signOut() {
    if (this.isBrowser) {
      // Set logout flag with expiration time (5 minutes)
      this.setLogoutFlag();

      // Clear localStorage
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.localStorage.removeItem(TokenStorageService.TOKEN_VALIDATION_KEY);

      // Clear cookies
      this.cookieService.deleteAll();
    }
  }

  public saveToken(token: string | null): void {
    if (this.isBrowser) {
      if (token) {
        console.log('TokenStorage: Saving token to storage');
        const cleanToken = token.replace(/^Bearer\s+/i, '');
        // Store in localStorage for backward compatibility
        window.localStorage.setItem(TOKEN_KEY, cleanToken);
        // Also store in cookie with secure settings
        this.cookieService.set(TOKEN_KEY, cleanToken, {
          secure: true,
          sameSite: 'Lax',
          path: '/'
        });
      } else {
        console.log('TokenStorage: Removing token from storage');
        window.localStorage.removeItem(TOKEN_KEY);
        this.cookieService.delete(TOKEN_KEY);
      }
    }
  }

  /**
   * Checks if the current URL is a login or authentication related page
   * and clears the logout flag if needed
   */
  public checkAndClearLogoutFlagForAuthPages(): void {
    if (!this.isBrowser) return;

    // Check if we're on a login or auth-related page
    const currentUrl = window.location.href.toLowerCase();
    const isAuthPage =
      currentUrl.includes('/auth/login') ||
      currentUrl.includes('/auth/oauth-callback') ||
      currentUrl.includes('/auth/signup') ||
      currentUrl.includes('/api/auth/');

    if (isAuthPage) {
      // If we're on an auth page, clear the logout flag
      this.clearLogoutFlag();
      console.log('TokenStorage: Auto-cleared logout flag for auth page');
    }
  }

  /**
   * Gets token from storage
   * @returns token string or null if not found
   */
  public getToken(): string | null {
    if (!this.isBrowser) return null;

    // Always check and clear logout flag when getting token from auth pages
    this.checkAndClearLogoutFlagForAuthPages();

    // Try to get from cookie first
    const cookieToken = this.cookieService.get(TOKEN_KEY);
    if (cookieToken) {
      return cookieToken;
    }
    // Fallback to localStorage
    return window.localStorage.getItem(TOKEN_KEY);
  }

  public getDecodedToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('[TokenStorageService] Error decoding token:', error);
      return null;
    }
  }

  public getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    // Try to get from cookie first
    const cookieToken = this.cookieService.get(REFRESH_TOKEN_KEY);
    if (cookieToken) {
      return cookieToken;
    }
    // Fallback to localStorage
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public saveRefreshToken(token: string): void {
    if (this.isBrowser) {
      // Store in localStorage for backward compatibility
      window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
      // Also store in cookie with secure settings
      this.cookieService.set(REFRESH_TOKEN_KEY, token, {
        secure: true,
        sameSite: 'Lax',
        path: '/',
        expires: 7 // 7 days
      });
    }
  }

  public saveUser(user: any): void {
    if (this.isBrowser) {
      if (!user) {
        console.log('TokenStorage: No user data to save');
        return;
      }

      // Ensure we save a well-formed user object
      const userData = {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        roles: user.roles || [],
        provider: user.provider // Preserve the auth provider information
      };

      console.log('TokenStorage: Saving user data:', userData);
      window.localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
  }

  public getUser(): any {
    if (!this.isBrowser) return null;
    const userStr = window.localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  public getProvider(): string | null {
    const user = this.getUser();
    return user?.provider || null;
  }

  public getRoles(): string[] {
    const user = this.getUser();
    return user?.roles || [];
  }

  public getLastTokenValidation(): TokenValidationStatus | null {
    if (!this.isBrowser) return null;

    const validationData = window.localStorage.getItem(TokenStorageService.TOKEN_VALIDATION_KEY);
    if (!validationData) return null;

    try {
      return JSON.parse(validationData);
    } catch (error) {
      console.error('[TokenStorageService] Error parsing token validation:', error);
      return null;
    }
  }

  public setLastTokenValidation(status: TokenValidationStatus): void {
    if (this.isBrowser) {
      window.localStorage.setItem(TokenStorageService.TOKEN_VALIDATION_KEY, JSON.stringify(status));
    }
  }

  public clearLastTokenValidation(): void {
    if (this.isBrowser) {
      window.localStorage.removeItem(TokenStorageService.TOKEN_VALIDATION_KEY);
    }
  }

  /**
   * Sets a flag that the user has recently logged out
   * Used to prevent automatic reconnection after logout
   */
  public setLogoutFlag(): void {
    if (this.isBrowser) {
      const expiration = Date.now() + (5 * 60 * 1000); // 5 minutes from now
      window.localStorage.setItem(LOGOUT_FLAG_KEY, expiration.toString());
    }
  }

  /**
   * Checks if the user has recently logged out
   * @returns boolean - true if user has logged out within the last 5 minutes
   */
  public getLogoutFlag(): boolean {
    if (!this.isBrowser) return false;

    const logoutTimestamp = window.localStorage.getItem(LOGOUT_FLAG_KEY);
    if (!logoutTimestamp) return false;

    const expiry = parseInt(logoutTimestamp, 10);
    const now = Date.now();

    if (now < expiry) {
      return true; // Still within the logout protection period
    } else {
      // Expired, clean up the flag
      window.localStorage.removeItem(LOGOUT_FLAG_KEY);
      return false;
    }
  }

  /**
   * Clears the logout flag manually
   */
  public clearLogoutFlag(): void {
    if (this.isBrowser) {
      window.localStorage.removeItem(LOGOUT_FLAG_KEY);
    }
  }
}
