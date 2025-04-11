import { Component, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { UserService } from "../../core/services/user.service";
import { DashboardHeaderComponent } from "../../shared/components/dashboard-header/dashboard-header.component";
import { DashboardSidebarComponent } from "../../shared/components/dashboard-sidebar/dashboard-sidebar.component";
import { TokenStorageService } from "../../core/services/token-storage.service";
import { Router } from "@angular/router";

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardHeaderComponent, DashboardSidebarComponent],
  templateUrl: './officer.component.html',
  styleUrls: ['./officer.component.scss']
})
export class OfficerComponent implements OnInit {
  content?: string;
  isSidebarOpen = true;

  constructor(
    private userService: UserService,
    private tokenStorage: TokenStorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if user is authenticated and has officer role
    const user = this.tokenStorage.getUser();
    if (!user || !user.roles?.includes('ROLE_OFFICER')) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.userService.getOfficerBoard().subscribe({
      next: data => {
        this.content = data;
      },
      error: err => {
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
  }
}
