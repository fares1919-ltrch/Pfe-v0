import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type MenuItem = {
  icon: string;
  label: string;
  route: string;
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

  menuItems: MenuItems = {
    citizen: [
      { icon: 'home', label: 'Home', route: '/' },
      { icon: 'dashboard', label: 'Dashboard', route: '/citizen-dashboard/dashboard' },
      { icon: 'description', label: 'My Documents', route: '/citizen-dashboard/documents' },
      { icon: 'event', label: 'Appointments', route: '/citizen-dashboard/appointements' },
      { icon: 'notifications', label: 'Notifications', route: '/citizen-dashboard/notifications' },
      { icon: 'history', label: 'History', route: '/citizen-dashboard/history' }
    ],
    officer: [
      { icon: 'home', label: 'Home', route: '/' },
      { icon: 'dashboard', label: 'Dashboard', route: '/officer-dashboard' },
      { icon: 'assignment', label: 'Tasks', route: '/officer-dashboard/tasks' },
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
