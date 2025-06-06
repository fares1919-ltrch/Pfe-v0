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
  description?: string;
};

type UserRole = 'citizen' | 'officer' | 'manager' | 'admin';

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
      { icon: 'home', label: 'Home', route: '/home', description: 'Main home page' },
      { icon: 'dashboard', label: 'Overview', route: '/citizen-dashboard/dashboard', description: 'Dashboard overview' },
      { icon: 'account_balance', label: 'Transactions', route: '/citizen-dashboard/transactions', description: 'Transaction history' },
      { icon: 'description', label: 'Request CPF', route: '/citizen-dashboard/cpf-request', description: 'Apply for a new CPF document' },
      { icon: 'event', label: 'My Appointments', route: '/citizen-dashboard/appointment', description: 'View appointments' },
      { icon: 'credit_card', label: 'Generated CPF', route: '/citizen-dashboard/overview/generated', description: 'Generated CPF cards' },
      { icon: 'warning', label: 'Fraud Detected', route: '/citizen-dashboard/overview/fraud', description: 'Fraud alerts' },
    ],
    officer: [
      { icon: 'home', label: 'Home', route: '/home', description: 'Main home page' },
      { icon: 'dashboard', label: 'Dashboard', route: '/officer-dashboard/dashboard', description: 'Officer dashboard overview' },

      // Main functionality components
      { icon: 'assignment_turned_in', label: 'Requests', route: '/officer-dashboard/approvals', description: 'Manage appointment requests' },
      { icon: 'event_available', label: 'Appointments', route: '/officer-dashboard/appointments', description: 'Manage appointments' },

      // User management
      { icon: 'people', label: 'Citizens', route: '/officer-dashboard/citizens', description: 'Manage citizen records' },

      // Additional components (uncomment to test)
      { icon: 'notification_important', label: 'CPF Notifications', route: '/officer-dashboard/cpf-notifications', description: 'CPF notifications' },
      { icon: 'upload_file', label: 'Data Submission', route: '/officer-dashboard/data-submission', description: 'Submit biometric data' },
    ],
    manager: [
      { icon: 'home', label: 'Home', route: '/home', description: 'Main home page' },
      { icon: 'dashboard', label: 'Overview', route: '/manager-dashboard/dashboard', description: 'Manager dashboard' },
      { icon: 'group', label: 'Deduplications', route: '/manager-dashboard/deduplications', description: 'Handle duplicate records' },
      { icon: 'warning', label: 'Fraud', route: '/manager-dashboard/fraud', description: 'Fraud management' },
      { icon: 'summarize', label: 'Citizens', route: '/manager-dashboard/citizens', description: 'Citizen management' }
    ],
    admin: [
      { icon: 'supervisor_account', label: 'Workers Management', route: '/admin/workers-management', description: 'Manage managers and officers' }
    ]
  };

  get currentMenuItems(): MenuItem[] {
    const role = this.userRole.toLowerCase() as UserRole;
    return this.menuItems[role] || [];
  }
}
