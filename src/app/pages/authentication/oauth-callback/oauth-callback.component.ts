import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen p-4">
      <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 class="text-2xl font-bold text-center mb-4">Completing Authentication</h2>
        <div class="text-center">
          <p *ngIf="isLoading">
            Please wait while we complete your authentication...
          </p>
          <p *ngIf="errorMessage" class="text-red-500 mt-2">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class OAuthCallbackComponent implements OnInit {
  isLoading = true;
  errorMessage = '';
  private isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Only proceed with token processing in browser environment
    if (!this.isBrowser) {
      console.log('Running in server context, skipping OAuth processing');
      return;
    }

    // Clear any logout flag to ensure we can properly log in
    this.tokenStorage.clearLogoutFlag();

    // Get provider from route parameters
    const provider = this.route.snapshot.paramMap.get('provider') || '';

    // If we have token in the query params, process it
    if (this.route.snapshot.queryParams['token']) {
      const token = this.route.snapshot.queryParams['token'];
      this.processTokenAndRedirect(token);
    } else {
      // Otherwise, call the backend endpoint to complete the process
      this.completeOAuthFlow(provider);
    }
  }

  private completeOAuthFlow(provider: string): void {
    this.authService.handleOAuthCallback(provider).subscribe({
      next: (data) => {
        if (data && data.accessToken) {
          this.tokenStorage.saveToken(data.accessToken);
          if (data.refreshToken) {
            this.tokenStorage.saveRefreshToken(data.refreshToken);
          }
          this.tokenStorage.saveUser(data);

          // Redirect based on user roles
          this.authService.redirectBasedOnUserRoles();
        } else {
          this.errorMessage = 'Authentication response missing token';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('OAuth callback error:', err);
        this.errorMessage = 'Failed to complete authentication. Please try again.';
        this.isLoading = false;

        // Redirect back to login after a delay
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      }
    });
  }

  private processTokenAndRedirect(token: string): void {
    console.log('OAuth Callback: Processing token');

    // Save the token first - make sure it's clean
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    this.tokenStorage.saveToken(cleanToken);

    // Get provider from the URL params
    const provider = this.route.snapshot.paramMap.get('provider') || '';

    try {
      // Use getUserInfo instead of checkSession for better compatibility
      console.log('OAuth Callback: Getting user info with token');
      this.authService.getUserInfo(cleanToken).subscribe({
        next: (user) => {
          console.log('OAuth Callback: User info received:', !!user);
          if (user && user.id) {
            // Add provider information to the user object
            user.provider = provider;

            console.log('OAuth Callback: Saving user data to storage with provider:', provider);
            this.tokenStorage.saveUser(user);

            // Wait a moment to ensure storage is updated
            setTimeout(() => {
              console.log('OAuth Callback: Redirecting to profile');
              this.redirectToProfile();
            }, 500);
          } else {
            console.warn('OAuth Callback: Valid user data not found in response');
            this.redirectToProfile();
          }
        },
        error: (error) => {
          console.error('OAuth Callback: Error retrieving user info:', error);

          // Even if we can't get the user info, we still have the token
          // Create a minimal user object with provider info
          const minimalUser = {
            id: 'temp-' + Date.now(),
            username: 'User',
            provider: provider,
            roles: ['ROLE_USER']
          };

          this.tokenStorage.saveUser(minimalUser);

          // So redirect to profile anyway
          this.redirectToProfile();
        }
      });
    } catch (error) {
      console.error('OAuth Callback: Exception during user info fetch:', error);
      // If any exception occurs, still redirect to profile
      this.redirectToProfile();
    }
  }

  private redirectToProfile(): void {
    console.log('OAuth Callback: Redirecting user to appropriate dashboard');
    // Check if token and user are in storage before redirect
    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();
    console.log('OAuth Callback: Before redirect - Token exists:', !!token);
    console.log('OAuth Callback: Before redirect - User exists:', !!user);

    // Redirect based on user roles
    try {
      this.authService.redirectBasedOnUserRoles();
    } catch (e) {
      console.error('Failed to redirect based on roles, using fallback', e);
      // Fallback to citizen dashboard if role-based redirect fails
      this.router.navigate(['/citizen-dashboard']);
    }
  }
}
