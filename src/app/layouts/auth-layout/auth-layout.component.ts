import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, Router, ActivatedRoute } from '@angular/router';
import { TokenStorageService } from '../../core/services/token-storage.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent implements OnInit {
  private isBrowser: boolean;

  constructor(
    private tokenStorage: TokenStorageService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // First check if there's a logout parameter in the URL
    const hasLogoutParam = this.route.snapshot.queryParamMap.has('logout');
    const googleProvider = this.route.snapshot.queryParamMap.get('provider') === 'google';

    // Check for google-logout flag in sessionStorage (only in browser context)
    let googleLogoutFlag = false;
    if (this.isBrowser && typeof sessionStorage !== 'undefined') {
      googleLogoutFlag = sessionStorage.getItem('google-logout') === 'true';
    }

    // If user is logging out, especially Google users, don't redirect them back to profile
    if (hasLogoutParam || googleLogoutFlag) {
      console.log('Auth Layout: User is logging out, staying on login page');
      // Clear any remaining auth data
      this.tokenStorage.signOut();

      // Clear the google logout flag if present
      if (this.isBrowser && googleLogoutFlag && typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('google-logout');
      }
      return;
    }

    // Otherwise proceed with normal token check
    const token = this.tokenStorage.getToken();
    if (token && !this.tokenStorage.getLogoutFlag()) {
      // Only redirect to profile if token exists and user hasn't recently logged out
      console.log('Token found, redirecting to profile');
      this.router.navigate(['/account/profile']);
    }
  }
}
