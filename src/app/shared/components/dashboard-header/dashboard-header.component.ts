import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent implements OnInit {
  @Input() userRole: string = '';
  @Input() username: string = '';
  @Input() isSidebarCollapsed: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  userPhotoUrl: string = 'assets/images/avatar-placeholder.png';
  dropdownOpen = false;
  alwaysShowSidebar = false; // Changed to false to show the menu toggle button

  constructor(private profileService: ProfileService, private router: Router) {}

  ngOnInit(): void {
    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        this.username = profile?.username || this.username;
        this.userPhotoUrl = profile?.photoUrl || this.userPhotoUrl;
      },
      error: () => {
        // fallback to placeholder
      }
    });
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.dropdownOpen = false;
  }

  onMenuClick(): void {
    this.toggleSidebar.emit();
  }
}
