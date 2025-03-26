// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./features/home/components/home.component')
          .then(m => m.HomeComponent),
        title: 'Home'
      }
      // Add other feature routes here
    ]
  },
  // Auth routes would go here with different layout
  {
    path: '**',
    redirectTo: 'home'
  }
];