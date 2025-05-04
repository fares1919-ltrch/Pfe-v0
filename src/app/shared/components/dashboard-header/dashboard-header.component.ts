import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss'],
  animations: [
    trigger('rotateAnimation', [
      transition(':enter', [
        style({ transform: 'rotate(0deg)' }),
        animate('300ms ease-out', style({ transform: 'rotate(180deg)' }))
      ]),
      transition(':leave', [
        style({ transform: 'rotate(180deg)' }),
        animate('300ms ease-in', style({ transform: 'rotate(0deg)' }))
      ])
    ])
  ]
})
export class DashboardHeaderComponent implements OnInit {
  @Input() userRole: string = '';
  @Input() username: string = '';
  @Input() isSidebarCollapsed: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  userPhotoUrl: string = 'assets/images/avatar-placeholder.png';
  dropdownOpen = false;
  alwaysShowSidebar = false; // Changed to false to show the menu toggle button
  isToggling = false; // Added to prevent multiple rapid clicks
  isProfileClicked = false; // Track if profile is being clicked

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

  // Add global click listener to handle clicks outside the dropdown
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // If we're not clicking on the profile and the dropdown is open, close it
    if (!this.isProfileClicked && !target.closest('.user-profile') && this.dropdownOpen) {
      this.dropdownOpen = false;
    }
    
    // Reset the flag after each click
    this.isProfileClicked = false;
  }

  toggleDropdown(event?: MouseEvent): void {
    // Safely stop propagation if the event exists
    if (event) {
      event.stopPropagation();
    }
    
    // Set flag to prevent the document click handler from immediately closing the dropdown
    this.isProfileClicked = true;
    
    // Toggle the dropdown state
    this.dropdownOpen = !this.dropdownOpen;
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.dropdownOpen = false;
  }

  onMenuClick(): void {
    if (this.isToggling) return; // Prevent rapid clicks
    
    this.isToggling = true;
    this.toggleSidebar.emit();
    
    // Re-enable after animation completes
    setTimeout(() => {
      this.isToggling = false;
    }, 400); // Match transition duration
  }
}
