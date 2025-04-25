import { ApplicationConfig,provideZoneChangeDetection,importProvidersFrom } from '@angular/core';
import { provideRouter,withComponentInputBinding } from '@angular/router';
import { provideHttpClient,withFetch,withInterceptors } from '@angular/common/http';
import { routes } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { authInterceptor } from './core/interceptors/auth.interceptor';
export const appConfig: ApplicationConfig = {
  providers: [
  importProvidersFrom(CoreModule),
  provideRouter(routes,withComponentInputBinding()),
  provideZoneChangeDetection(),
  provideHttpClient(
    withFetch(),
    withInterceptors([authInterceptor])
  ),
  provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura
            }
        })
]
};
