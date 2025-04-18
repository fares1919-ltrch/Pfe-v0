import { Component, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  // set the current year
  year: number = new Date().getFullYear();
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
  }

  // Add smooth scrolling functionality for anchor links
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.isBrowser) return;

    const target = event.target as HTMLElement;
    const anchorElement = target.closest('a');

    if (anchorElement && anchorElement.hash && anchorElement.hash.length > 1) {
      event.preventDefault();

      const targetElement = document.querySelector(anchorElement.hash);
      if (targetElement) {
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
