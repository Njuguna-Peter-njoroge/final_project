import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

(async () => {
  try {
    await bootstrapApplication(App, appConfig);
    console.log('🚀 Application bootstrapped successfully!');
  } catch (error) {
    console.error('❌ Error bootstrapping the Angular application:', error);
  }
})();
