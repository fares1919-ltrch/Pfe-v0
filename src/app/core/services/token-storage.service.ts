import { Injectable, Inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

const TOKEN_KEY = "auth-token";
const USER_KEY = "auth-user";

@Injectable({
  providedIn: 'root'  // Ensure service is provided at root level
})
export class TokenStorageService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  signOut() {
    if (this.isBrowser) {
      window.sessionStorage.clear();
    }
  }

  public saveToken(token: string | null): void {
    if (this.isBrowser) {
      if (token) {
        console.log('Saving Access Token:', token);
        window.sessionStorage.setItem(TOKEN_KEY, token);
      } else {
        console.warn('Removing Access Token');
        window.sessionStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  public getToken(): string | null {
    if (!this.isBrowser) return null;

    const token = window.sessionStorage.getItem(TOKEN_KEY);
    console.log('Retrieved Access Token:', token ? 'Token exists' : 'No token');
    return token || null;  // Explicitly return null if no token
  }

  public getRefreshToken(): string | null {
    if (!this.isBrowser) return null;

    const token = window.sessionStorage.getItem('refreshToken');
    console.log('Retrieved Refresh Token:', token ? 'Token exists' : 'No token');
    return token || null;  // Explicitly return null if no token
  }

  public saveRefreshToken(token: string): void {
    if (this.isBrowser) {
      console.log('Saving Refresh Token:', token);
      window.sessionStorage.setItem('refreshToken', token);
    }
  }

  public saveUser(user: any): void {
    if (this.isBrowser) {
      console.log('Saving User Details:', user);
      window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  public getUser(): any {
    if (!this.isBrowser) return null;

    const userStr = window.sessionStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;

    console.group('Retrieved User Details');
    console.log('User String:', userStr);
    console.log('Parsed User:', user);
    console.groupEnd();

    return user;
  }

  public getRoles(): string[] {
    const user = this.getUser();
    return user?.roles || [];
  }
}
