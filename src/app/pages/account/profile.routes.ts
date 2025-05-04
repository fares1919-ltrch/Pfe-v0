import { Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { authGuard } from '../../core/guards/auth.guard';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    component: ProfileComponent,
    canActivate: [authGuard],
    data: { requiresAuth: true },
    title: 'My Account'
  }
];
