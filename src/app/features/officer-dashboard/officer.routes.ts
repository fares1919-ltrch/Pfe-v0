import { Routes } from '@angular/router';
import { OfficerComponent } from './officer.component';
import { OfficerRequestsComponent } from './components/requests/requests.component';
import { OfficerDashboardOverviewComponent } from './components/overview/officer-dashboard-overview.component';
export const OFFICER_ROUTES: Routes = [
  {
    path: '',
    component: OfficerComponent,
    children: [
      { path: 'dashboard', component: OfficerDashboardOverviewComponent },
      { path: 'requests', component: OfficerRequestsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
