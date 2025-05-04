import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { BodyComponent } from '../body/body.component';
import { TokenStorageService } from '../../../core/services/token-storage.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent, BodyComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  currentUser: any;
  isLoading: boolean = true;

  constructor(private tokenStorage: TokenStorageService) {
    // Get user from token storage immediately to avoid UI flicker
    this.currentUser = this.tokenStorage.getUser();
  }

  ngOnInit(): void {
    // Set a minimum loading time to ensure the loading state is shown
    // This helps prevent the login page flash during refresh
    const minLoadingTime = 500; // ms
    const startTime = Date.now();

    // Check if we have a token to determine if we're authenticated
    const hasToken = this.tokenStorage.getToken() !== null;

    if (hasToken) {
      // If we have a token, show loading state for a minimum time
      setTimeout(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

        // Ensure loading state is shown for at least the minimum time
        setTimeout(() => {
          this.isLoading = false;
        }, remainingTime);
      }, 100); // Small initial delay to let other processes complete
    } else {
      // If no token, don't show loading state (we'll redirect to login)
      this.isLoading = false;
    }
  }
}
