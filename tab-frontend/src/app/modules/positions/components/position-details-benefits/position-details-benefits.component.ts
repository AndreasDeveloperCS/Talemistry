import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { take, takeUntil } from 'rxjs';
import { PositionBenefit } from '../../../position-benefits/models/position-benefit';
import { BenefitsService } from '../../services/benefits.service';
import { PositionsService } from '../../services/positions.service';
import { SearchLogicService } from '../../../general/services/search-logic.service';
import { ContentService } from '../../../general/services/content.service';
import { InputFilterBaseComponent } from '../../../general/components/input-filter-base/input-filter-base.component';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';

@Component({
  selector: 'app-position-details-benefits',
  templateUrl: './position-details-benefits.component.html',
  styleUrl: './position-details-benefits.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailsBenefitsComponent extends InputFilterBaseComponent<PositionBenefit> implements OnInit {
  benefitsList: PositionBenefit[] = [];
  
  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<PositionBenefit>((e: PositionBenefit) => e.benefit), value: this.filterControl.value });
    return this._filterParams;
  }

  constructor(crudService: BenefitsService,
    searchLogicService: SearchLogicService,
    private changeDetectorRef: ChangeDetectorRef,
    public content: ContentService,
    public positionsService: PositionsService) {
    super(crudService, searchLogicService, changeDetectorRef);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.populateCollection();
    this.positionsService.modelUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.benefitsList = this.positionsService.model.positionDetails.conditions.benefits;
        this.changeDetectorRef.markForCheck();
      });
  }

  async add(rawInput: string) {
    const input = rawInput?.trim();

    if (this.inputControl.valid) {
      const positionBenefit = new PositionBenefit();
      positionBenefit.benefit = input;
      positionBenefit.isVerified = false;
      const alreadyExists = this.benefitsList?.some(
        (benefit) => benefit.benefit === input
      );

      if (!alreadyExists) {
        this.benefitsList.push(positionBenefit);
        this.crudService.createAsync(positionBenefit, true, false).pipe(take(1)).subscribe({
          next: (createdBenefit) => {
            console.log('Created benefit:', createdBenefit);
            // Update the benefit in the list with the one returned from the server
            const index = this.benefitsList.findIndex(b => b.benefit === input);
            if (index !== -1) {
              this.benefitsList[index] = createdBenefit;
            }
            this.positionsService.notifyUpdate();
            this.changeDetectorRef.markForCheck();
          },
          error: (error) => {
            console.error('Error creating benefit:', error);
            this.changeDetectorRef.markForCheck();
          }
        });
      } else {
        console.warn('Benefit already exists:', input);
        this.positionsService.notifyUpdate();
        this.changeDetectorRef.markForCheck();
      }
    }
    this.resetForm();
  }

  remove(item: PositionBenefit) {
    const index = this.benefitsList.findIndex(b =>
      b.benefit === item.benefit
    );

    if (index !== -1) {
      this.benefitsList.splice(index, 1);
    } else {
      console.warn('Benefit not found:', item);
    }
    this.positionsService.notifyUpdate();
  }

  getValue(item: PositionBenefit) {
    return item.benefit;
  }
}
