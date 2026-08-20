import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { takeUntil } from 'rxjs';
import { PositionCertification } from '../../models/position-certification';
import { CertificationsService } from '../../services/certifications.service';
import { PositionsService } from '../../services/positions.service';
import { InputFilterBaseComponent } from '../../../general/components/input-filter-base/input-filter-base.component';
import { ContentService } from '../../../general/services/content.service';
import { SearchLogicService } from '../../../general/services/search-logic.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';

@Component({
  selector: 'app-position-details-required-certification',
  templateUrl: './position-details-required-certification.component.html',
  styleUrl: './position-details-required-certification.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailsRequiredCertificationComponent extends InputFilterBaseComponent<PositionCertification> implements OnInit {
  isCertificateRequired: boolean = true;
  certificationList: PositionCertification[] = [];
    
  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<PositionCertification>
      ((e: PositionCertification) => e.certification), value: this.filterControl.value });
    return this._filterParams;
  }

  constructor(crudService: CertificationsService,
    public content: ContentService,
    searchLogicService: SearchLogicService,
    private changeDetectorRef: ChangeDetectorRef,
    public positionsService: PositionsService) {
    super(crudService, searchLogicService, changeDetectorRef)
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.positionsService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
      this.certificationList = this.positionsService.model.positionDetails.requirements.requiredCertification;
      this.isCertificateRequired = this.positionsService.model.positionDetails.requirements.isRequiredCertification;
      this.changeDetectorRef.markForCheck();
    });
  }

  async add(rawInput: string) {
    const input = rawInput?.trim();

    if (this.inputControl.valid) {
      const positionCertification = new PositionCertification();
      positionCertification.certification = input;
      positionCertification.isVerified = false;
      const alreadyExists = this.certificationList?.some(
        (certification) => certification.certification === input
      );

      if (!alreadyExists) {
        this.certificationList.push(positionCertification);
        this.positionsService.notifyUpdate();
      }
    }
    this.resetForm();
  }

  remove(item: PositionCertification) {
    const index = this.certificationList.findIndex(c =>
      c.certification === item.certification
    );

    if (index !== -1) {
      this.certificationList.splice(index, 1);
    } else {
      console.warn('Certification not found:', item);
    }
    this.positionsService.notifyUpdate();
  }

  getValue(item: PositionCertification) {
    return item.certification;
  }

  toggle(value: boolean) {
    if(!this.isCertificateRequired) {
      this.positionsService.model.positionDetails.requirements.requiredCertification = [];
    }
    this.isCertificateRequired = value;
    this.positionsService.model.positionDetails.requirements.isRequiredCertification = value;
    this.positionsService.notifyUpdate();
  }
}
