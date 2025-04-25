import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

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

  constructor(private authService: AuthService, private router: Router) { }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        // Optionally show a notification here
        this.router.navigate(['/']); // Redirect to user home
      },
      error: (err) => {
        // Optionally show an error notification here
        console.error('Logout failed:', err);
        // Fallback: still clear tokens and redirect
        this.authService['tokenStorageService'].signOut();
        this.router.navigate(['/']);
      }
    });
  }

  menuItems: MenuItems = {
    citizen: [
      { icon: 'home', label: 'Home', route: '/' },
      { icon: 'dashboard', label: 'Dashboard', route: '/citizen-dashboard/dashboard' },
      { icon: 'description', label: 'Cpf Request', route: '/citizen-dashboard/cpf-request' },
      { icon: 'description', label: 'My Documents', route: '/citizen-dashboard/documents' },
      { icon: 'event', label: 'Appointments', route: '/citizen-dashboard/appointments' },
      { icon: 'notifications', label: 'Notifications', route: '/citizen-dashboard/notifications' },
      { icon: 'history', label: 'History', route: '/citizen-dashboard/history' }
    ],
    officer: [
      { icon: 'home', label: 'Home', route: '/' },
      { icon: 'dashboard', label: 'Dashboard', route: '/officer-dashboard/dashboard' },
      { icon: 'description', label: 'CPF Requests', route: '/officer-dashboard/requests' },
      { icon: 'assignment_turned_in', label: 'Pending Approvals', route: '/officer-dashboard/approvals' },
      { icon: 'event_available', label: 'Appointments', route: '/officer-dashboard/appointments' },
      { icon: 'people', label: 'Citizens', route: '/officer-dashboard/citizens' },
      { icon: 'people', label: 'Citizens', route: '/officer-dashboard/citizens' },
      { icon: 'calendar_today', label: 'Schedule', route: '/officer-dashboard/schedule' },
      { icon: 'assessment', label: 'Reports', route: '/officer-dashboard/reports' }
    ],
    manager: [
      { icon: 'home', label: 'Home', route: '/' },
      { icon: 'dashboard', label: 'Dashboard', route: '/manager-dashboard' },
      { icon: 'group', label: 'Staff', route: '/manager-dashboard/staff' },
      { icon: 'analytics', label: 'Analytics', route: '/manager-dashboard/analytics' },
      { icon: 'settings', label: 'Settings', route: '/manager-dashboard/settings' },
      { icon: 'summarize', label: 'Reports', route: '/manager-dashboard/reports' }
    ]
  };

  get currentMenuItems(): MenuItem[] {
    const role = this.userRole.toLowerCase() as UserRole;
    return this.menuItems[role] || [];
  }
}
