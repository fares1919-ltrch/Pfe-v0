import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { DashboardSidebarComponent } from '../../shared/components/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from '../../shared/components/dashboard-header/dashboard-header.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    DashboardSidebarComponent,
    DashboardHeaderComponent
  ],
  template: `
    <div class="dashboard-layout">
      <app-dashboard-sidebar [userRole]="userRole" [isCollapsed]="isSidebarCollapsed" (logout)="onLogout()"></app-dashboard-sidebar>
      <div class="dashboard-main-content" [class.collapsed]="isSidebarCollapsed">
        <app-dashboard-header
          [userRole]="userRole"
          [username]="username"
          [isSidebarCollapsed]="isSidebarCollapsed"
          (toggleSidebar)="toggleSidebar()"
        ></app-dashboard-header>
        <main class="dashboard-content" [class.collapsed]="isSidebarCollapsed">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      background: #f4f4f4;
    }
    app-dashboard-sidebar {
      flex-shrink: 0;
      z-index: 1000;
    }
    .dashboard-main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      margin-left: 280px;
    }
    .dashboard-main-content.collapsed {
      margin-left: 80px;
    }
    .dashboard-content {
      flex: 1;
      padding: 2rem 2.5rem 2rem 2.5rem;
      transition: padding-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      background: transparent;
      min-width: 0;
      padding-top: 90px;
    }
    .dashboard-content.collapsed {
      padding-left: 1.5rem;
      padding-top: 90px;
    }
    @media (max-width: 1024px) {
      .dashboard-main-content,
      .dashboard-main-content.collapsed {
        margin-left: 80px;
      }
      .dashboard-content,
      .dashboard-content.collapsed {
        padding-left: 1rem;
        padding-right: 1rem;
      }
    }
    @media (max-width: 768px) {
      .dashboard-main-content,
      .dashboard-main-content.collapsed {
        margin-left: 0;
      }
      .dashboard-content,
      .dashboard-content.collapsed {
        padding: 1rem 0.5rem;
      }
    }
  `]
})
export class AdminDashboardComponent {
  isSidebarCollapsed = false;
  username = '';
  userRole = 'admin'; // Hardcoded for local admin mode

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onLogout() {
    // No-op for admin
  }
}
