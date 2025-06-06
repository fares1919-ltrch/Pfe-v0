import { Routes } from '@angular/router';
import { OfficerComponent } from './officer.component';
import { ApprovalsComponent } from './components/Validated Appointments/approvals.component';
import { DataSubmissionComponent } from './components/Biometric Submission/data-submission.component';
import { AppointmentsComponent } from './components/Pending Appointments/appointments.component';
import { CitizensComponent } from './components/citizens/citizens.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CPFNotificationsComponent } from './components/cpf-notifications/cpf-notifications.component';

export const OFFICER_ROUTES: Routes = [
  {
    path: '',
    component: OfficerComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'approvals', component: ApprovalsComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'citizens', component: CitizensComponent },
      { path: 'cpf-notifications', component: CPFNotificationsComponent },
      { path: 'data-submission', component: DataSubmissionComponent },
      { path: 'data-submission/:userId/:appointmentId', component: DataSubmissionComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];


