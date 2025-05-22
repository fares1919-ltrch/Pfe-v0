import { Routes } from '@angular/router';
import { ManagerComponent } from './manager.component';
import { CitizensComponent } from './components/citizens/citizens.component';
import { DeduplicationsComponent } from './components/deduplications/deduplications.component';
import { ComplaintsComponent } from './components/complaints/complaints.component';
import { FraudsComponent } from './components/frauds/frauds.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';

export const MANAGER_ROUTES: Routes = [
  {
    path: '',
    component: ManagerComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'citizens',
        component: CitizensComponent
      },
      {
        path: 'dashboard',
        component: DashboardOverviewComponent
      },
      {
        path: 'deduplications',
        component: DeduplicationsComponent
      },
      {
        path: 'complaints',
        component: ComplaintsComponent
      },
      {
        path: 'frauds',
        component: FraudsComponent
      }
    ]
  }
];
