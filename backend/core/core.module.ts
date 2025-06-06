import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { TokenStorageService } from './services/token-storage.service';
import { ProfileService } from './services/profile.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    AuthService,
    TokenStorageService,
    ProfileService
  ]
})
export class CoreModule { }
