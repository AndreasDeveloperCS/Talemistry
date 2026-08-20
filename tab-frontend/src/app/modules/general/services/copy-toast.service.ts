import {
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
  Injectable,
  inject
} from '@angular/core';
import { CopyToastComponent } from '../components/copy-toast/copy-toast.component';

@Injectable({
  providedIn: 'root'
})
export class CopyToastService {

  private appRef = inject(ApplicationRef);

  private injector = inject(EnvironmentInjector);

  show(
    message: string = 'Copied to clipboard'
  ): void {

    const componentRef = createComponent(
      CopyToastComponent,
      {
        environmentInjector: this.injector
      }
    );

    componentRef.instance.message = message;

    this.appRef.attachView(
      componentRef.hostView
    );

    document.body.appendChild(
      componentRef.location.nativeElement
    );

    setTimeout(() => {

      this.appRef.detachView(
        componentRef.hostView
      );

      componentRef.destroy();

    }, 3000);
  }
}