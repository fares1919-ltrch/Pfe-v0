import { Component } from '@angular/core';
import { MapsComponent } from '../maps/maps.component';
import { DashboardHeaderComponent } from "../../../../shared/components/dashboard-header/dashboard-header.component";
import { DashboardSidebarComponent } from "../../../../shared/components/dashboard-sidebar/dashboard-sidebar.component";
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-appointements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MapsComponent,
    DashboardHeaderComponent,
    DashboardSidebarComponent
  ],
  templateUrl: './appointements.component.html',
  styleUrl: './appointements.component.scss'
})
export class AppointementsComponent {
  isSidebarOpen = true;
  identityNumber: number = 0;
  address: string = '';
  loading: boolean = false;

  constructor(private http: HttpClient) {}

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onSubmit(form: NgForm) {
    if (!this.identityNumber || !this.address) {
      alert('Please fill in both fields.');
      return;
    }

    this.loading = true;

    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const data = {
      identityNumber: this.identityNumber,
      address: this.address,
    };
console.log(data, "body")
    this.http.post('http://localhost:8080/api/cpf-requests', data, { headers }).subscribe({
      next: () => {
        alert('Request submitted successfully!');
        this.identityNumber = 0;
        this.address = '';
        this.loading = false;
        form.resetForm();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to submit request.');
        this.loading = false;
      },
    });
  }
}
