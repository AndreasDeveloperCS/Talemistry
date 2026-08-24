// import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
// import { AppComponent } from './app/app.component';

// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

(window as any).MonacoEnvironment = {
  getWorkerUrl: function (_moduleId: any, label: string) {
    switch (label) {
      case 'json':
        return 'assets/monaco/vs/language/json/json.worker.js';
      case 'css':
        return 'assets/monaco/vs/language/css/css.worker.js';
      case 'html':
        return 'assets/monaco/vs/language/html/html.worker.js';
      case 'typescript':
      case 'javascript':
        return 'assets/monaco/vs/language/typescript/ts.worker.js';
      default:
        return 'assets/monaco/vs/editor/editor.worker.js';
    }
  }
};

platformBrowserDynamic().bootstrapModule(AppModule).then(ref => {
  // Ensure Angular destroys itself on hot reloads.

  // if (window["ngRef"]) {
  //   window["ngRef"].destroy();
  // }

  // window["ngRef"] = ref;

  // Otherwise, log the boot error
}).catch(err => console.error(err));
