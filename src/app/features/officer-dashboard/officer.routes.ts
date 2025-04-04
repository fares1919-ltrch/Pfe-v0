import { Routes } from '@angular/router';
import { OfficerComponent } from './officer.component';

export const OFFICER_ROUTES: Routes = [
  {
    path: '',
    component: OfficerComponent,
    pathMatch: 'full'
  }
];
