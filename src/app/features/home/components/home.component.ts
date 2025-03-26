import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { AboutComponent } from './about/about.component';
import { FaqSectionComponent } from "./faq-section/faq-section.component";
import { FindUsComponent } from './find-us/find-us.component';
import { FeaturesShowcaseComponent } from './features-showcase/features-showcase.component';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroSectionComponent,
    AboutComponent,
    FaqSectionComponent,
    FeaturesShowcaseComponent,
    FindUsComponent
],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {}