import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContentService } from '../../../general/services/content.service';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';

@Component({
  selector: 'app-additional-information',
  templateUrl: './additional-information.component.html',
  styleUrls: ['./additional-information.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdditionalInformationComponent implements OnInit, OnDestroy {
  additionalInformationForm: FormGroup;

  constructor(private fb: FormBuilder, 
    public service: CandidateUserProfileService,
    public content: ContentService,
    private cdr: ChangeDetectorRef
  ) {
    this.additionalInformationForm = this.fb.group({
      additionalInformation: ['', Validators.required]
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
