import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';
import { FormValidationService } from '../../../general/services/form-validation.service';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-objective',
  templateUrl: './objective.component.html',
  styleUrl: './objective.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObjectiveComponent implements OnInit, OnDestroy  {
  form: FormGroup;

  constructor(private formBuilder: FormBuilder,
    public service: CandidateUserProfileService,
    public validator: FormValidationService,
    private cdr: ChangeDetectorRef,
    public content: ContentService) {
    this.form = this.formBuilder.group({
      objective: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.cdr.markForCheck();
  }

  onInputBlur() {
    this.service.saveCacheCurrentStateIntoInternalStorage();
  }

  ngOnDestroy(): void {
    this.service.saveCacheCurrentStateIntoInternalStorage();
  }
}