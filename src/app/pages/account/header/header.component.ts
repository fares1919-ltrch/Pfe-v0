import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'profile-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
})
export class HeaderComponent implements OnInit {
  currentUser: any;
  dashboardLink = '';
  menuOpen = false;

  constructor(
    private tokenStorage: TokenStorageService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.tokenStorage.getUser();
    console.log('User Roles:', this.currentUser?.roles);
    this.setDashboardLink();
  }

  private setDashboardLink() {
    const role = this.currentUser?.roles[0];
    console.log('Current User Roles:', this.currentUser?.roles);
    console.log('Selected Role:', role);
    this.dashboardLink = {
      'ROLE_CITIZEN': '/citizen-dashboard',
      'ROLE_MANAGER': '/manager-dashboard',
      'ROLE_OFFICER': '/officer-dashboard'
    }[role as string] || '/';
    console.log('Dashboard Link:', this.dashboardLink);
  }

  logout() {
    this.authService.logout().subscribe({
      complete: () => {
        this.tokenStorage.signOut();
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Logout error:', err);
        this.tokenStorage.signOut();
        this.router.navigate(['/auth/login']);
      }
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
