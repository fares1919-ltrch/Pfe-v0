import { Routes } from '@angular/router';
import { CitizenComponent } from './citizen.component';

export const CITIZEN_ROUTES: Routes = [
  {
    path: '',
    component: CitizenComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/Dashboard Overview/cpf-overview.component')
          .then(m => m.CPFOverviewComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./components/transactions/transactions.component')
          .then(m => m.TransactionsComponent)
      },
      {
        path: 'cpf-request',
        loadComponent: () => import('./components/Appointment Request/cpf-request.component')
          .then(m => m.CpfRequestComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'appointment',
        loadComponent: () => import('./components/Appointements Consulting/appointements.component')
          .then(m => m.AppointementsComponent)
      },
      {
        path: 'overview/generated',
        loadComponent: () => import('./components/Dashboard Overview/cpf-generated-overview/cpf-generated-overview.component')
          .then(m => m.CpfGeneratedOverviewComponent)
      },
      {
        path: 'overview/fraud',
        loadComponent: () => import('./components/Dashboard Overview/fraud-detected-overview/fraud-detected-overview.component')
          .then(m => m.FraudDetectedOverviewComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./components/all-notifications/all-notifications.component')
          .then(m => m.AllNotificationsComponent)
      }
    ]
  }
];
