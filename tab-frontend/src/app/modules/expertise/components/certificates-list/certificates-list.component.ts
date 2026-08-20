import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-certificates-list',
    templateUrl: './certificates-list.component.html',
    styleUrls: ['./certificates-list.component.scss'],
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CertificatesListComponent {

  certificates: any[] = [];

  onAddCertificate(certificate: any) {
    this.certificates.push(certificate);
  }
}
