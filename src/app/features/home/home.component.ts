import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { AboutComponent } from './components/about/about.component';
import { FaqSectionComponent } from "./components/faq-section/faq-section.component";
import { FindUsComponent } from './components/find-us/find-us.component';
import { FeaturesShowcaseComponent } from './components/features-showcase/features-showcase.component';
import { UserService } from '../../core/services/user.service';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule,
    RouterModule,
    HeroSectionComponent,
    AboutComponent,
    FaqSectionComponent,
    FeaturesShowcaseComponent,
    FindUsComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [UserService]
})
export class HomeComponent implements OnInit {
  content?: string;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.getPublicContent().subscribe({
      next: data => {
        this.content = data;
      },
      error: err => {
        // Safer error handling
        if (err.error && typeof err.error === 'string') {
          try {
            const errorObj = JSON.parse(err.error);
            this.content = errorObj.message || 'An error occurred';
          } catch (e) {
            // If parsing fails, use the error text directly or a fallback
            this.content = err.error || 'An error occurred';
          }
        } else if (err.message) {
          this.content = err.message;
        } else {
          this.content = 'An error occurred while fetching data';
        }

        console.error('Error fetching public content:', err);
      }
    });
  }
}