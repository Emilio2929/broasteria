import {ApplicationConfig,provideBrowserGlobalErrorListeners,provideZonelessChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';
import {provideHttpClient,withInterceptors} from '@angular/common/http';
import { routes } from './app.routes';
import { tokenInterceptor } from './interceptors/token.interceptor';
import { tenantInterceptor } from './interceptors/tenant.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideRouter(routes),

    provideHttpClient(
      withInterceptors([tenantInterceptor, tokenInterceptor])
    ),
  ],
};
