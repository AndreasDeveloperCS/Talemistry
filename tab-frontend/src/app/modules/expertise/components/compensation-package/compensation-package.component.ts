import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Currency } from '../../../general/models/currency';
import { ContentService } from '../../../general/services/content.service';
import { CompensationTimeline } from '../../../positions/models/position-details';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';

@Component({
  selector: 'app-compensation-package',
  templateUrl: './compensation-package.component.html',
  styleUrl: './compensation-package.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompensationPackageComponent implements OnInit {

  private _selectedItem: Currency = new Currency();

  public get selectedItem(): Currency {
    return this._selectedItem;
  }

  public set selectedItem(value: Currency) {
    this._selectedItem = value;
  }

  public get selectedCompensationTimeline(): CompensationTimeline {
    return this.service.model.preferences?.compensationPackage?.compensationTimline ?? CompensationTimeline.annual;
  }

  public set selectedCompensationTimeline(value: CompensationTimeline) {
    this.service.model.preferences.compensationPackage.compensationTimline = value;
  }

  compensationTimelineControl: FormControl = new FormControl(CompensationTimeline.month, [Validators.required]);
  currencyControl!: FormControl;
  compensationTimelines: CompensationTimeline[] = [];
  comfortValue: number = 0;
  minimumValue: number = 0;

  constructor(public content: ContentService,
    private cdr: ChangeDetectorRef,
    public service: CandidateUserProfileService) 
  {}

  ngOnInit(): void {
    this.compensationTimelines = Object.values(CompensationTimeline).filter((item: CompensationTimeline) => item != CompensationTimeline.contract);
    this.selectedCompensationTimeline = CompensationTimeline.month;
    this.cdr.markForCheck();
  }

  updateMin(value: any) {
    console.log('updateMin', value);
    this.service.model.preferences.compensationPackage.minimum = value;
    const map = this.service.model.preferences.compensationPackage.internalFunction(
      this.service.model.preferences.compensationPackage.minimumMap, value, this.selectedCompensationTimeline
    );
    this.cdr.markForCheck();
  }

  updateComfort(value: any) {
    console.log('updateComfort', value);
    this.service.model.preferences.compensationPackage.comfort = value;
    const map = this.service.model.preferences.compensationPackage.internalFunction(
      this.service.model.preferences.compensationPackage.comfortMap, value, this.selectedCompensationTimeline
    );
    this.cdr.markForCheck();
  }

  updateCurrency($event: any) {
    this.service.model.preferences.compensationPackage.currency = $event;
    this.cdr.markForCheck();
  }
}
