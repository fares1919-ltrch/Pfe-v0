import { Routes } from '@angular/router';
import { OfficerComponent } from './officer.component';
import { OfficerRequestsComponent } from './components/requests/requests.component';
import { OfficerDashboardOverviewComponent } from './components/overview/officer-dashboard-overview.component';
import { ApprovalsComponent } from './components/approvals/approvals.component';
import { DataSubmissionComponent } from './components/data-submission/data-submission.component';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { CitizensComponent } from './components/citizens/citizens.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const OFFICER_ROUTES: Routes = [
  {
    path: '',
    component: OfficerComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'requests', component: OfficerRequestsComponent },
      { path: 'approvals', component: ApprovalsComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'citizens', component: CitizensComponent },
      { path: 'data-submission/:userId/:appointmentId', component: DataSubmissionComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];


