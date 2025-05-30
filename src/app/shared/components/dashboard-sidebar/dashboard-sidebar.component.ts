import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { CookieService } from 'ngx-cookie-service';

type MenuItem = {
  icon: string;
  label: string;
  route: string;
  queryParams?: { [key: string]: string };
};

type UserRole = 'citizen' | 'officer' | 'manager';

type MenuItems = {
  [key in UserRole]: MenuItem[];
};

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.scss']
})
export class DashboardSidebarComponent {
  @Input() userRole: string = '';
  @Input() isCollapsed: boolean = false;

  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private cookieService: CookieService
  ) { }

  logout() {
    const currentUser = this.tokenStorage.getUser();
    this.authService.logoutAndRedirect(currentUser, this.cookieService, true);
  }

  menuItems: MenuItems = {
    citizen: [
      { icon: 'home', label: 'Home', route: '/home' },
      { icon: 'dashboard', label: 'Overview', route: '/citizen-dashboard/dashboard' },
      { icon: 'account_balance', label: 'Transactions', route: '/citizen-dashboard/transactions' },
      { icon: 'description', label: 'Cpf Request', route: '/citizen-dashboard/cpf-request' },
      { icon: 'event', label: 'My Appointment', route: '/citizen-dashboard/appointment' },
      { icon: 'credit_card', label: 'Generated CPF', route: '/citizen-dashboard/overview/generated' },
      { icon: 'watch_later', label: 'Pending CPF', route: '/citizen-dashboard/overview/pending' },
      { icon: 'warning', label: 'Fraud Detected', route: '/citizen-dashboard/overview/fraud' }
    ],
    officer: [
      { icon: 'home', label: 'Home', route: '/home' },
      { icon: 'dashboard', label: 'Overview', route: '/officer-dashboard/dashboard' },
      // { icon: 'description', label: 'Requests', route: '/officer-dashboard/requests' },
      { icon: 'assignment_turned_in', label: 'Requests', route: '/officer-dashboard/approvals' },
      { icon: 'event_available', label: 'Appointments', route: '/officer-dashboard/appointments' },
      { icon: 'people', label: 'citizens', route: '/officer-dashboard/citizens' },
      // { icon: 'people', label: 'dataSubmission', route: '/officer-dashboard/data-submission/:userId/:appointmentId' },
      ],
    manager: [
      { icon: 'home', label: 'Home', route: '/home' },
      { icon: 'dashboard', label: 'Overview', route: '/manager-dashboard/dashboard' },
      { icon: 'group', label: 'Deduplications', route: '/manager-dashboard/deduplications' },
      { icon: 'warning', label: 'Fraud', route: '/manager-dashboard/fraud' },
      { icon: 'summarize', label: 'Citizens', route: '/manager-dashboard/citizens' }
    ]
  };

  get currentMenuItems(): MenuItem[] {
    const role = this.userRole.toLowerCase() as UserRole;
    return this.menuItems[role] || [];
  }
}
