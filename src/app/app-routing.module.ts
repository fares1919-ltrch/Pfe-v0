import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Auth routes
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component')
      .then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/authentication/login/login.component')
          .then(m => m.LoginComponent)
          .catch(err => {
            console.error('Failed to load login component', err);
            throw err;
          })
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/authentication/register/register.component')
          .then(m => m.RegisterComponent)
          .catch(err => {
            console.error('Failed to load register component', err);
            throw err;
          })
      },
      {
        path: '',
        loadChildren: () => import('./pages/authentication/authentication.routes')
          .then(m => m.AUTH_ROUTES)
      }
    ]
  },

  // Protected routes - These should be defined BEFORE the catch-all '' route
  {
    path: 'profile',
    canActivate: [authGuard],
    data: { requiresAuth: true }, // Add explicit flag for auth requirement
    loadChildren: () => import('./pages/account/profile.routes')
      .then(m => m.PROFILE_ROUTES)
  },
  {
    path: 'citizen-dashboard',
    canActivate: [authGuard],
    data: { requiresAuth: true },
    loadChildren: () => import('./features/citizen-dashboard/citizen.routes')
      .then(m => m.CITIZEN_ROUTES)
  },
  {
    path: 'officer-dashboard',
    canActivate: [authGuard],
    data: { requiresAuth: true },
    loadChildren: () => import('./features/officer-dashboard/officer.routes')
      .then(m => m.OFFICER_ROUTES)
  },
  {
    path: 'manager-dashboard',
    canActivate: [authGuard],
    data: { requiresAuth: true },
    loadChildren: () => import('./features/manager-dashboard/manager.routes')
      .then(m => m.MANAGER_ROUTES)
  },

  // Public home route - This should be the LAST route since it has the '' catch-all
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'home',
        loadChildren: () => import('./features/home/home.routes')
          .then(m => m.HOME_ROUTES)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      { path: '**', redirectTo: 'home' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false // Set to true only for debugging
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
