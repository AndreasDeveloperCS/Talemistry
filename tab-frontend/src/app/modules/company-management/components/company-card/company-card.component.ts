import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { environment } from '../../../../../environments/environment';
import { CompanyVersion } from '../../../companies/models/company';
import { CompanyVersionService } from 'src/app/modules/companies/services/company-version.service';

@Component({
  selector: 'app-company-card',
  templateUrl: './company-card.component.html',
  styleUrl: './company-card.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyCardComponent {
  @Input() company!: CompanyVersion;
  @Input() isCurrent: boolean = false;
  @Output() setCurrent = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  public get canEditItem(): boolean {
    return this.authGuard.canEditItem(FUNCTIONALBLOCK.COMPANIES, this.company);
  }

  constructor(
    public authGuard: AuthGuardService,
    private companyService: CompanyVersionService,
  ) {}

  ngOnInIt() {
    console.log('Company', this.company);
  }

  onOpenCompanyPage(companyId: string) {
    this.companyService.openCompanyPage(companyId);
  }
}
