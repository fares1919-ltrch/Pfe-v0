import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit{
  useCases = [
    {
      title: 'Enterprise AI',
      description: 'Streamline complex business processes with intelligent automation.',
      icon: 'business'
    },
    {
      title: 'Research & Development',
      description: 'Accelerate scientific discovery and innovation through AI-powered insights.',
      icon: 'science'
    },
    {
      title: 'Customer Experience',
      description: 'Enhance customer interactions with personalized AI-driven solutions.',
      icon: 'support_agent'
    }
  ];

  constructor() {}

  ngOnInit(): void {}
}