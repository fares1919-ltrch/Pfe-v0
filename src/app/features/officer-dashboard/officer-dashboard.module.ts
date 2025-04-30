import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficerDashboardRoutingModule } from './officer-dashboard-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    OfficerDashboardRoutingModule,
    MatIconModule,
    DashboardComponent
  ]
})
export class OfficerDashboardModule { } 