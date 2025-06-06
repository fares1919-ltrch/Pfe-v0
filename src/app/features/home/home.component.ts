import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { AboutComponent } from './components/about/about.component';
import { FaqSectionComponent } from "./components/faq-section/faq-section.component";
import { FindUsComponent } from './components/find-us/find-us.component';
import { FeaturesShowcaseComponent } from './components/features-showcase/features-showcase.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { GuidesComponent } from './components/guides/guides.component';
import { ChatbotComponent } from '../chatbot/chatbot.component';

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
    GuidesComponent,
    ChatbotComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  content?: string;

  ngOnInit(): void {
    // No need to fetch public content if not required
  }
}
