import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-guides',
  templateUrl: './guides.component.html',
  styleUrls: ['./guides.component.scss'],
  standalone: true
})
export class GuidesComponent {
  constructor(private router: Router) {}

  goToFullGuide() {
    this.router.navigate(['/guide']);
  }
}
