import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-full-guide',
  standalone: true,
  templateUrl: './full-guide.component.html',
  styleUrls: ['./full-guide.component.scss']
})
export class FullGuideComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/home']);
  }
}
