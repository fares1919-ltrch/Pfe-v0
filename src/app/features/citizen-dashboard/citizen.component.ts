import { Component, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { UserService } from "../../core/services/user.service";
import { DashboardSidebarComponent } from "../../shared/components/dashboard-sidebar/dashboard-sidebar.component";
import { DashboardHeaderComponent } from "../../shared/components/dashboard-header/dashboard-header.component";
import { TokenStorageService } from "../../core/services/token-storage.service";
import { Router ,RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardSidebarComponent, DashboardHeaderComponent,RouterOutlet],
  templateUrl: './citizen.component.html',
  styleUrls: ['./citizen.component.scss']
})
export class CitizenComponent implements OnInit {
  content?: string;
  isSidebarOpen = true;

  constructor(
    public tokenStorage: TokenStorageService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if user is authenticated and has citizen role
    const user = this.tokenStorage.getUser();
    if (!user || !user.roles?.includes('ROLE_USER')) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.userService.getUserBoard().subscribe({
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
