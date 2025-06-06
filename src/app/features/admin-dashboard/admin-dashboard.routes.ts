import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    children: [
      {
        path: 'workers-management',
        loadComponent: () => import('./components/workers-management/workers-management.component').then(m => m.WorkersManagementComponent)
      },
      {
        path: '',
        redirectTo: 'workers-management',
        pathMatch: 'full'
      }
    ]
  }
];
