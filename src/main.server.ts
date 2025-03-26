import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideClientHydration } from '@angular/platform-browser';

const bootstrap = () => bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideClientHydration()
  ]
});

export default bootstrap;
