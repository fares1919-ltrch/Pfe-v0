import { Injectable, Inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

const TOKEN_KEY = "auth-token";
const USER_KEY = "auth-user";
const REFRESH_TOKEN_KEY = "refreshToken";

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
      window.localStorage.clear();
    }
  }

  public saveToken(token: string | null): void {
    if (this.isBrowser) {
      if (token) {
        const cleanToken = token.replace(/^Bearer\s+/i, '');
        window.localStorage.setItem(TOKEN_KEY, cleanToken);
      } else {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  public getToken(): string | null {
    if (!this.isBrowser) return null;
    return window.localStorage.getItem(TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public saveRefreshToken(token: string): void {
    if (this.isBrowser) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
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
