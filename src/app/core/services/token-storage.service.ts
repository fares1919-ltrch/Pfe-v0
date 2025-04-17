import { Injectable, Inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { CookieService } from 'ngx-cookie-service';

const TOKEN_KEY = "auth-token";
const USER_KEY = "auth-user";
const REFRESH_TOKEN_KEY = "refreshToken";

interface DecodedToken {
  exp?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'  // Ensure service is provided at root level
})
export class TokenStorageService {
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cookieService: CookieService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  signOut() {
    if (this.isBrowser) {
      // Clear localStorage
      window.localStorage.clear();
      // Clear cookies
      this.cookieService.deleteAll();
    }
  }

  public saveToken(token: string | null): void {
    if (this.isBrowser) {
      if (token) {
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
        window.localStorage.removeItem(TOKEN_KEY);
        this.cookieService.delete(TOKEN_KEY);
      }
    }
  }

  public getToken(): string | null {
    if (!this.isBrowser) return null;
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
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  public getUser(): any {
    if (!this.isBrowser) return null;
    const userStr = window.localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  public getRoles(): string[] {
    const user = this.getUser();
    return user?.roles || [];
  }
}
