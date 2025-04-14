import { Routes } from '@angular/router';
import { CitizenComponent } from './citizen.component';
import { AppointementsComponent } from './components/appointements/appointements.component';


export const CITIZEN_ROUTES: Routes = [
  {
    path: 'dashboard',
    component: CitizenComponent
  },
  {
    path : 'appointements',
    component : AppointementsComponent
  }
];
