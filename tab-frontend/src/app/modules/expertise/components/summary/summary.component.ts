import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';
import { FormValidationService } from '../../../general/services/form-validation.service';
import { ContentService } from '../../../general/services/content.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryComponent implements OnInit, OnDestroy {
  form: FormGroup;

  constructor(private fb: FormBuilder,
    public service: CandidateUserProfileService,
    public validator: FormValidationService,
    private cdr: ChangeDetectorRef,
    public content: ContentService) {
    this.form = this.fb.group({
      summary: ['', Validators.required]
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
