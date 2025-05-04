import { Component, HostListener, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TokenStorageService } from '../../../../core/services/token-storage.service';
import { AuthService } from '../../../../core/services/auth.service';

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
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.checkScrollPosition();
      window.addEventListener('scroll', this.onScroll.bind(this));
    }
  }

  onScroll() {
    if (this.isBrowser) {
      this.isScrolled = window.scrollY > 0;
    }
  }

  checkScrollPosition() {
    if (!this.isBrowser) return;

    const scrollPosition = window.scrollY + 100;

    for (let i = this.sections.length - 1; i >= 0; i--) {
      const section = this.sections[i];

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

  @HostListener('document:click', ['$event'])
  closeDropdowns(event: MouseEvent) {
    if (!this.isBrowser) return;

    const target = event.target as HTMLElement;

    if (!target.closest('[data-dropdown="language"]') && this.isLanguageDropdownOpen) {
      this.isLanguageDropdownOpen = false;
    }

    if (!target.closest('[data-dropdown="mobile-menu"]') &&
        !target.closest('[data-toggle="mobile-menu"]') &&
        this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

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
        this.isMobileMenuOpen = false;
        this.activeSection = sectionId;

        const headerHeight = document.querySelector('header')?.offsetHeight || 0;
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  }

  handleLoginClick() {
    const token = this.tokenStorage.getToken();
    if (token) {
      this.authService.redirectBasedOnUserRoles();
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
