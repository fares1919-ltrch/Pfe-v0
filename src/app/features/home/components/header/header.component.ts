import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class HeaderComponent {
  isMobileMenuOpen = false;
  isLanguageDropdownOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isLanguageDropdownOpen = false;
    }
  }

  toggleLanguageDropdown() {
    this.isLanguageDropdownOpen = !this.isLanguageDropdownOpen;
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  closeDropdowns(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Check if click is outside language dropdown trigger
    if (!target.closest('[data-dropdown="language"]') && this.isLanguageDropdownOpen) {
      this.isLanguageDropdownOpen = false;
    }

    // Check if click is outside mobile menu and not on toggle button
    if (!target.closest('[data-dropdown="mobile-menu"]') &&
        !target.closest('[data-toggle="mobile-menu"]') &&
        this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  // Add smooth scrolling functionality for anchor links
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const anchorElement = target.closest('a');

    if (anchorElement && anchorElement.hash && anchorElement.hash.length > 1) {
      event.preventDefault();

      const targetElement = document.querySelector(anchorElement.hash);
      if (targetElement) {
        // Close mobile menu
        this.isMobileMenuOpen = false;

        // Smooth scroll to the element
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }
}