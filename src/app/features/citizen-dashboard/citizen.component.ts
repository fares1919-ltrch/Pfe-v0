import { Component, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { DashboardSidebarComponent } from "../../shared/components/dashboard-sidebar/dashboard-sidebar.component";
import { DashboardHeaderComponent } from "../../shared/components/dashboard-header/dashboard-header.component";
import { TokenStorageService } from "../../core/services/token-storage.service";
import { Router ,RouterOutlet} from "@angular/router";
import { ChatbotComponent } from "../chatbot/chatbot.component";
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardSidebarComponent, DashboardHeaderComponent,RouterOutlet,ChatbotComponent],
  templateUrl: './citizen.component.html',
  styleUrls: ['./citizen.component.scss']
})
export class CitizenComponent implements OnInit {
  content?: string;
  isSidebarOpen = true;

  constructor(
    public tokenStorage: TokenStorageService,
    private profileService: ProfileService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if user is authenticated and has citizen role
    const user = this.tokenStorage.getUser();
    if (!user || !user.roles?.includes('ROLE_USER')) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Example:
    // this.profileService.getUserProfile().subscribe({
    //   next: (user) => { /* handle user info */ },
    //   error: (err) => { /* handle error */ }
    // });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
