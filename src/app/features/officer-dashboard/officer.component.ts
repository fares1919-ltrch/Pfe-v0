import { Component, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { DashboardHeaderComponent } from "../../shared/components/dashboard-header/dashboard-header.component";
import { DashboardSidebarComponent } from "../../shared/components/dashboard-sidebar/dashboard-sidebar.component";
import { TokenStorageService } from "../../core/services/token-storage.service";
import { Router, RouterOutlet } from "@angular/router";
import { AppointmentService } from "../../core/services/appointment.service";
import { ProfileService } from '../../core/services/profile.service';


@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardHeaderComponent, DashboardSidebarComponent, RouterOutlet],
  templateUrl: './officer.component.html',
  styleUrls: ['./officer.component.scss']
})
export class OfficerComponent implements OnInit {
  content?: string;
  isSidebarOpen = true;

  constructor(
    public tokenStorage: TokenStorageService,
    private profileService: ProfileService,
    private router: Router
  ) {
    // Retrieve sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    if (savedSidebarState !== null) {
      this.isSidebarOpen = savedSidebarState === 'true';
    }
  }

  ngOnInit(): void {
    // Check if user is authenticated and has officer role
    const user = this.tokenStorage.getUser();
    console.log('Officer user:', user);
    if (!user || !user.roles?.includes('ROLE_OFFICER')) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.profileService.getUserProfile().subscribe({
      next: (user: any) => {
        this.content = user;
      },
      error: (err: any) => {
        if (err.status === 401 || err.status === 403) {
          this.tokenStorage.signOut();
          this.router.navigate(['/auth/login']);
        }
        this.content = JSON.parse(err.error).message;
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    // Save state to localStorage
    localStorage.setItem('sidebarOpen', this.isSidebarOpen.toString());
  }
}

