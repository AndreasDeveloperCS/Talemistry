import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs';
import { PositionEducation } from '../../models/position-education';
import { EducationService } from '../../services/education.service';
import { PositionsService } from '../../services/positions.service';
import { InputFilterBaseComponent } from '../../../general/components/input-filter-base/input-filter-base.component';
import { ContentService } from '../../../general/services/content.service';
import { AcademicEducationLevelType } from '../../../skills/models/skill';
import { SearchLogicService } from '../../../general/services/search-logic.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';

@Component({
  selector: 'app-position-details-required-education',
  templateUrl: './position-details-required-education.component.html',
  styleUrl: './position-details-required-education.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailsRequiredEducationComponent extends InputFilterBaseComponent<PositionEducation> implements OnInit {
  requiredEducation: AcademicEducationLevelType[] = [];
  isEducationRequired: boolean = true;
  educationList: PositionEducation[] = [];
  educationOptionsList: PositionEducation[] = [];
  
  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<PositionEducation>
      ((e: PositionEducation) => e.education), value: this.filterControl.value });
    return this._filterParams;
  }

  constructor(crudService: EducationService,
    public content: ContentService,
    searchLogicService: SearchLogicService,
    private changeDetectorRef: ChangeDetectorRef,
    public positionsService: PositionsService) {
    super(crudService, searchLogicService, changeDetectorRef)
    this.requiredEducation = Object.values(AcademicEducationLevelType);
    this.educationOptionsList = Object.values(AcademicEducationLevelType).map(education => {
      const positionEducation = new PositionEducation();
      positionEducation.education = education;
      return positionEducation;
    });
  }

  override ngOnInit(): void {
    this.positionsService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
      this.educationList = this.positionsService.model.positionDetails.requirements.requiredEducation;
      this.isEducationRequired = this.positionsService.model.positionDetails.requirements.isRequiredEducation;
      this.changeDetectorRef.markForCheck();
    });
  }

  async add(rawInput: string) {
    const input = rawInput?.trim();

    if (this.inputControl.valid) {
      const positionEducation = new PositionEducation();
      positionEducation.education = input;
      positionEducation.isVerified = false;
      const alreadyExists = this.educationList?.some(
        (education) => education.education === input
      );

      if (!alreadyExists) {
        this.educationList.push(positionEducation);
        this.positionsService.notifyUpdate();
      }
    }
    this.resetForm();
  }

  remove(item: PositionEducation) {
    const index = this.educationList.findIndex(e =>
      e.education === item.education
    );

    if (index !== -1) {
      this.educationList.splice(index, 1);
    } else {
      console.warn('Education not found:', item);
    }
    this.positionsService.notifyUpdate();
  }

  getValue(item: PositionEducation) {
    return item.education;
  }

  toggle(value: boolean) {
    if(!this.isEducationRequired) {
      this.positionsService.model.positionDetails.requirements.requiredEducation = [];
    }
    this.isEducationRequired = value;
    this.positionsService.model.positionDetails.requirements.isRequiredEducation = value;
    this.positionsService.notifyUpdate();
  }
}
