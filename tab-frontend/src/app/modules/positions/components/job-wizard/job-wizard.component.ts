import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { take } from 'rxjs';
import { ChatGptService } from 'src/app/modules/general/services/chat-gpt.service';
import { OpenPosition } from '../../models/position';
import { JobWizardPayload } from '../../models/job-wizard-payload';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { JobType, WorkPlace } from '../../models/position-details';
import { ProficiencyLevel } from 'src/app/modules/skills/models/skill';
import { PositionsService } from '../../services/positions.service';
import { CompanyVersion } from 'src/app/modules/companies/models/company';
import { environment } from 'src/environments/environment';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

@Component({
  selector: 'app-job-wizard',
  templateUrl: './job-wizard.component.html',
  styleUrl: './job-wizard.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobWizardComponent {

  @Output() 
  aiModeChanged = new EventEmitter<boolean>();

  @Output()
  formStatusChange = new EventEmitter<boolean>();

  @Output()
  isPositionAiGenerated = new EventEmitter<boolean>();

  @ViewChild('autoCompleteInput', { read: MatAutocompleteTrigger }) autoComplete!: MatAutocompleteTrigger;

  userId = sessionStorage.getItem(`${environment.storage.userId}`);
  step = 0;
  wizardForm!: FormGroup;
  loading: boolean = false;
  rawSkill = ''; 
  generatedPosition: OpenPosition | null = null;

  jobTypeList = Object.entries(JobType).map(([key, value]) => ({key, value}));
  workPlaceList = Object.entries(WorkPlace).map(([key, value]) => ({key, value}));
  levelList = Object.entries(ProficiencyLevel).map(([key, value]) => ({key, value}));

  predefinedSkills: string[] = [ 'English' ];
  isAiMode = false;

  get skills(): FormArray {
    return this.wizardForm.get('skills') as FormArray;
  }

  constructor(private fb: FormBuilder, 
    private chatGptService: ChatGptService,
    private positionService: PositionsService,
    private cdr: ChangeDetectorRef,
  ) { }

  @HostListener('keydown.enter', ['$event'])
  onEnter(e: KeyboardEvent) {
    if (e.isComposing) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const value = this.rawSkill?.trim();
    console.log('HostListener', value);

    if (value) {
      this.add(value);
    }
  }

  startWizard() {
    this.aiModeChanged.emit(true);
    this.step = 1;
    this.isAiMode = true; 
    this.initForm();
  }

  initForm() {
    this.wizardForm = this.fb.group({
      title: ['', Validators.required],
      skills: this.fb.array(this.predefinedSkills, Validators.required),
      description: ['', Validators.required],
    });
  }

  submitForm() {
    this.loading = true;
    const formValue = this.wizardForm.value;

    const payload: JobWizardPayload = {
      title: formValue.title,
      skills: formValue.skills,
      description: formValue.description
    };

    this.chatGptService.generateOpenPosition(payload).pipe(take(1))
      .subscribe({
        next: (res) => {
          console.log('AI Generated OpenPosition:', res);
          if(res) {
            this.generatedPosition = res;
            this.positionService.model = res;
            this.positionService.model.positionDetails.company = new CompanyVersion();
            this.positionService.model.positionDetails.hiringManagers = [];
            this.positionService.model.positionDetails.headquarterLocation = [];
            this.positionService.model.positionDetails.general.specificRequirements = [];
            this.positionService.model.userId = this.userId;
            this.positionService.model.createdBy = this.userId;
            this.positionService.notifyUpdate();
            this.formStatusChange.emit(true);
            this.aiModeChanged.emit(false); 
            this.isPositionAiGenerated.emit(true);
            this.loading = false;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error generating open position', err);
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  disableAiMode() {
    this.isAiMode = false;
    this.step = 0;
    this.aiModeChanged.emit(this.isAiMode); 
    this.isPositionAiGenerated.emit(false);
  }

  add(rawValue: string) {
    console.log('add Skill', rawValue);
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return;
    }

    if (this.skills.value.includes(trimmed)) {
      return;
    }

    this.skills.push(new FormControl(trimmed));
    this.rawSkill = '';
  }

  remove(skill: string) {
    console.log('remove Skill', skill);
    const index = this.skills.value.indexOf(skill);
    if (index >= 0) {
      this.skills.removeAt(index);
    }
  }
}
