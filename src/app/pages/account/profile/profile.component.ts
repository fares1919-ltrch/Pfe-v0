import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { BodyComponent } from '../body/body.component';
import { TokenStorageService } from '../../../core/services/token-storage.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent, BodyComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  currentUser: any;

  constructor(private tokenStorage: TokenStorageService) {
    this.currentUser = this.tokenStorage.getUser();
  }
}