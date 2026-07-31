import 'zone.js';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { appConfig } from './app/core/config/app-config';

document.title = appConfig.appName;

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));

