import { Component, Input, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CPFDocument } from '../../../../../types/cpf-document.model';

@Component({
  selector: 'app-cpf-document-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cpf-document-content.component.html',
  styleUrls: ['./cpf-document-content.component.scss']
})
export class CpfDocumentContentComponent {
  @Input() documentData: CPFDocument | undefined;

  constructor(public elementRef: ElementRef) { }
}
