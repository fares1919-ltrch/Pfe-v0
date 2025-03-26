import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FaqItem {
  question: string;
  answer: string;
  isOpen?: boolean;
}

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq-section.component.html',
  styleUrls: ['./faq-section.component.scss']
})
export class FaqSectionComponent {
  @Input() title: string = 'FAQ';
  @Input() description: string = 'Looking to learn more about our product? Here are some of the most common questions.';
  @Input() faqItems: FaqItem[] = [];
  @Input() faqs: FaqItem[] = [
    {
      question: 'What is Identity Secure?',
      answer: 'Identity Secure is a digital identity management platform that helps prevent fraud and protect Brazilian CPF identifiers through advanced biometric verification.',
      isOpen: false
    },
    {
      question: 'How does biometric verification work?',
      answer: 'Our platform uses advanced biometric technologies to verify user identities, including facial recognition, fingerprint scanning, and real-time fraud detection algorithms.',
      isOpen: false
    },
    {
      question: 'Is my personal data safe?',
      answer: 'Absolutely. We use state-of-the-art encryption and follow strict data protection regulations to ensure the highest level of security for your personal information.',
      isOpen: false
    }
  ];

  toggleQuestion(item: FaqItem): void {
    item.isOpen = !item.isOpen;
  }
}