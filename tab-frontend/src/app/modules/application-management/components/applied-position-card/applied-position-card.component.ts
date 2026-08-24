import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OpenPosition } from '../../../positions/models/position';
import { environment } from '../../../../../environments/environment';
import { PositionData } from '../../../positions/models/position-data';
import { Router } from '@angular/router';
import { IAppliedPosition } from '../../models/applied-positions-payloads';
import { PositionsService } from 'src/app/modules/positions/services/positions.service';
import { CompanyVersionService } from 'src/app/modules/companies/services/company-version.service';
import { CompanyVersion } from 'src/app/modules/companies/models/company';
import { ContractConditions, GeneralDescription, PositionRequirements } from 'src/app/modules/positions/models/position-details';

@Component({
  selector: 'app-applied-position-card',
  templateUrl: './applied-position-card.component.html',
  styleUrl: './applied-position-card.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppliedPositionCardComponent {
  @Input()
  position!: IAppliedPosition;

  companiesLink: string = `${environment.sourceUrl}/${environment.routes.companies}`;

  get positionRequirements(): PositionRequirements {
    return this.position.positionDetails.requirements;
  }

  get company(): CompanyVersion {
    return this.position.positionDetails.company;
  }

  get positionConditions(): ContractConditions {
    return this.position.positionDetails.conditions;
  }

  get positionGeneral(): GeneralDescription {
    return this.position.positionDetails.general;
  }
  
  constructor(
    private router: Router,
    private positionService: PositionsService,
    private companyService: CompanyVersionService
  ) {}

  navigateToPosition() {
    if(this.position.positionId) {
      this.positionService.openPositionPage(this.position.positionId);
    }
  }

  openCompanyPage(companyId: string) {
    if(companyId) {
      this.companyService.openCompanyPage(companyId);
    }
  }
}
