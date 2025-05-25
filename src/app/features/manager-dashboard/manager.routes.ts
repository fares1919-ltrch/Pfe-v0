import { Routes } from '@angular/router';
import { ManagerComponent } from './manager.component';
import { CitizensComponent } from './components/citizens/citizens.component';
import { DeduplicationsComponent } from './components/deduplications/deduplications.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { FraudComplaintsComponent } from './components/fraud-complaints/fraud-complaints.component';

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
        path: 'fraud',
        component: FraudComplaintsComponent
      }
    ]
  }
];
