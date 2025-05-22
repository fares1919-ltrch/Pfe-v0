import { Routes } from '@angular/router';
import { CpfRequestComponent } from './components/cpf-request/cpf-request.component';
import { CitizenComponent } from './citizen.component';
import { AppointementsComponent } from './components/appointements/appointements.component';
import { CPFOverviewComponent } from './components/cpf-overview/cpf-overview.component';

export const CITIZEN_ROUTES: Routes = [
  {
    path: '',
    component: CitizenComponent,
    children: [
      { path: 'dashboard', component: CPFOverviewComponent },
      { path: 'cpf-request', component: CpfRequestComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'appointment', component: AppointementsComponent }
    ]
  }
];
