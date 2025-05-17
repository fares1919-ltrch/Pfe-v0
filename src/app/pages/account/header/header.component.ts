import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: any;
  menuOpen: boolean = false;
  dashboardLink: string = '/dashboard';
  faBars = faBars;
  faTimes = faTimes;
  isLoggingOut = false;
  private isBrowser: boolean;

  constructor(
    private tokenStorage: TokenStorageService,
    private authService: AuthService,
    private router: Router,
    private cookieService: CookieService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.currentUser = this.tokenStorage.getUser();

    // Determine dashboard link based on user role
    if (this.currentUser && this.currentUser.roles) {
      if (this.currentUser.roles.includes('ROLE_OFFICER')) {
        this.dashboardLink = '/officer-dashboard';
      } else if (this.currentUser.roles.includes('ROLE_MANAGER')) {
        this.dashboardLink = '/manager-dashboard';
      } else {
        // Default to citizen dashboard
        this.dashboardLink = '/citizen-dashboard/dashboard';
      }
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.isLoggingOut = true;
    this.authService.logoutAndRedirect(this.currentUser, this.cookieService, this.isBrowser);
    this.isLoggingOut = false;
  }
}
