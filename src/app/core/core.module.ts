import { NgModule } from '@angular/core';
import { UserService } from './services/user.service';
import { TokenStorageService } from './services/token-storage.service';
import { AuthService } from './services/auth.service';

@NgModule({
  imports: [
  ],
  providers: [
    AuthService,
    TokenStorageService,
    UserService
  ]
})
export class CoreModule {}