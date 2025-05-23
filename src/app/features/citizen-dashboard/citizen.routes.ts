import { Routes } from '@angular/router';
import { CitizenComponent } from './citizen.component';

export const CITIZEN_ROUTES: Routes = [
  {
    path: '',
    component: CitizenComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/cpf-overview/cpf-overview.component')
          .then(m => m.CPFOverviewComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./components/transactions/transactions.component')
          .then(m => m.TransactionsComponent)
      },
      {
        path: 'cpf-request',
        loadComponent: () => import('./components/cpf-request/cpf-request.component')
          .then(m => m.CpfRequestComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'appointment',
        loadComponent: () => import('./components/appointements/appointements.component')
          .then(m => m.AppointementsComponent)
      },
      {
        path: 'overview/generated',
        loadComponent: () => import('./components/cpf-overview/cpf-generated-overview/cpf-generated-overview.component')
          .then(m => m.CpfGeneratedOverviewComponent)
      },
      {
        path: 'overview/pending',
        loadComponent: () => import('./components/cpf-overview/cpf-pending-overview/cpf-pending-overview.component')
          .then(m => m.CpfPendingOverviewComponent)
      },
      {
        path: 'overview/fraud',
        loadComponent: () => import('./components/cpf-overview/fraud-detected-overview/fraud-detected-overview.component')
          .then(m => m.FraudDetectedOverviewComponent)
      }
    ]
  }
];
