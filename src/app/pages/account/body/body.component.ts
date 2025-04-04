import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'profile-body',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements OnInit {
  currentUser: any;
  roleContent: string = '';
  dashboardData: any;

  constructor(
    private tokenStorage: TokenStorageService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.currentUser = this.tokenStorage.getUser();
    this.loadRoleContent();
  }

  private loadRoleContent() {
    const role = this.currentUser?.roles[0];

    switch(role) {
      case 'user':
        this.userService.getUserBoard().subscribe(data => {
          this.dashboardData = data;
        });
        this.roleContent = 'User Dashboard - Personalized Content';
        break;

      case 'manager':
        this.userService.getManagerBoard().subscribe(data => {
          this.dashboardData = data;
        });
        this.roleContent = 'Manager Dashboard - Team Overview';
        break;

      case 'officer':
        this.userService.getOfficerBoard().subscribe(data => {
          this.dashboardData = data;
        });
        this.roleContent = 'Officer Dashboard - System Analytics';
        break;
    }
  }
}