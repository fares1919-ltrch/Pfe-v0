import { Routes } from '@angular/router';
import { CpfRequestComponent } from './components/cpf-request/cpf-request.component';
import { CitizenDashboardOverviewComponent } from './components/overview/citizen-dashboard-overview.component';
import { CitizenComponent } from './citizen.component';
import { AppointementsComponent } from './components/appointements/appointements.component';

export const CITIZEN_ROUTES: Routes = [
  {
    path: '',
    component: CitizenComponent,
    children: [
      { path: 'dashboard', component: CitizenDashboardOverviewComponent },
      { path: 'cpf-request', component: CpfRequestComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'appointment', component: AppointementsComponent }
    ]
  }
];
