import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { InputFilterBaseComponent } from '../../../general/components/input-filter-base/input-filter-base.component';
import { ContentService } from '../../../general/services/content.service';
import { SearchLogicService } from '../../../general/services/search-logic.service';
import { MotivationalFactor } from '../../../motivational-factors/models/motivational-factor';
import { MotivationalFactorsService } from '../../../motivational-factors/services/motivational-factors.service';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';

@Component({
  selector: 'app-motivational-factors',
  templateUrl: './motivational-factors.component.html',
  styleUrl: './motivational-factors.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MotivationalFactorsComponent extends InputFilterBaseComponent<MotivationalFactor> implements OnInit {
  placeholderText: string = 'Motivational Factor';

  constructor(crudService: MotivationalFactorsService,
    searchLogicService: SearchLogicService,
    changeDetectorRef: ChangeDetectorRef,
    public content: ContentService,
    public cpService: CandidateUserProfileService) {
    super(crudService, searchLogicService, changeDetectorRef)
  }

  override ngOnInit(): void {
    this.filtering.splice(0, this.filtering.length);
    super.ngOnInit();
  }

  @HostListener('keydown.enter', ['$event'])
  onEnter(e: KeyboardEvent) {
    if (e.isComposing) return;
    if (this.autocompleteTrigger?.panelOpen) return;

    e.preventDefault();
    e.stopPropagation();

    const value = this.rawInputlValue?.trim();
    if (value) this.add(value);
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();
    setTimeout(() => {
      this.suppressFocus = false;
      this.cdr.markForCheck();
    }, 0);
  }

  suppressFocus = true;

  async add(rawInput: string) {
    const input = rawInput?.trim();

    // console.log("this.inputControl: Motivational factors: ", input)
    if (this.inputControl.valid) {
      const motivationalFactor = new MotivationalFactor();
      motivationalFactor.factor = input;
      motivationalFactor.isVerified = false;
      const alreadyExists = this.cpService.model.preferences.motivationalFactors.some(
        (factor) => factor.factor === input
      );

      if (!alreadyExists) {
        // console.log("VERIFIED this.inputControl: ", motivationalFactor);
        this.cpService.model.preferences.motivationalFactors.push(motivationalFactor);

        this.crudService.createAsync(motivationalFactor, true, true);
      }
    }
    this.resetForm();
    this.cpService.saveCacheCurrentStateIntoInternalStorage();
  }

  remove(item: MotivationalFactor) {
    const targetIndex = this.cpService.model.preferences.motivationalFactors.findIndex(element => element.factor == item.factor);
    this.cpService.model.preferences.motivationalFactors.splice(targetIndex, 1);
  }

  override get populatedCollection() {
    return this.cpService.model.preferences.motivationalFactors;
  }

  getValue(item: MotivationalFactor) {
    return item.factor;
  }

  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<MotivationalFactor>((e: MotivationalFactor) => e.factor), value: this.filterControl.value });
    return this._filterParams;
  }
} 
