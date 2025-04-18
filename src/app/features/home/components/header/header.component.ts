import { Component, HostListener, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class HeaderComponent implements OnInit {
  isMobileMenuOpen = false;
  isLanguageDropdownOpen = false;
  isScrolled = false;
  activeSection = 'home';
  sections: string[] = ['home', 'about', 'features', 'guides', 'faq', 'find-us', 'contact'];
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Only run in browser environment
    if (this.isBrowser) {
      // Initial check for scroll position
      this.checkScrollPosition();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.isBrowser) return;

    // Check if the page has been scrolled more than 50px
    this.isScrolled = window.scrollY > 50;

    // Update active section based on scroll position
    this.checkScrollPosition();
  }

  checkScrollPosition() {
    if (!this.isBrowser) return;

    // Get current scroll position
    const scrollPosition = window.scrollY + 100; // Adding offset to account for header height

    // Determine which section is currently in view
    for (let i = this.sections.length - 1; i >= 0; i--) {
      const section = this.sections[i];

      // Special handling for home section
      if (section === 'home') {
        const heroElement = document.querySelector('#hero');
        if (heroElement && heroElement.getBoundingClientRect().top + window.scrollY <= scrollPosition) {
          this.activeSection = 'home';
          break;
        }
        continue;
      }

      const element = document.querySelector(`#${section}`);
      if (element && element.getBoundingClientRect().top + window.scrollY <= scrollPosition) {
        this.activeSection = section;
        break;
      }
    }
  }

  isActive(section: string): boolean {
    return this.activeSection === section;
  }

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
    if (!this.isBrowser) return;

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
    if (!this.isBrowser) return;

    const target = event.target as HTMLElement;
    const anchorElement = target.closest('a');

    if (anchorElement && anchorElement.hash && anchorElement.hash.length > 1) {
      event.preventDefault();

      const sectionId = anchorElement.hash.substring(1);
      const targetElement = document.querySelector(anchorElement.hash);

      if (targetElement) {
        // Close mobile menu
        this.isMobileMenuOpen = false;

        // Update active section
        this.activeSection = sectionId;

        // Determine top offset based on header height
        const headerHeight = document.querySelector('header')?.offsetHeight || 0;

        // Calculate position to scroll to
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight;

        // Smooth scroll to the element
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  }
}
