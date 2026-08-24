import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';
import moment from 'moment';
import { ContentService } from '../../../general/services/content.service';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { Skill, SkillType, UserCertification } from '../../../skills/models/skill';
import { CandidateUserProfileService } from '../../services/candidate-user-profile.service';

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CertificateComponent {
  @Input() 
  itemType: string = '';

  @Input() 
  itemNames: any[] = [];

  @Input() 
  skill!: UserCertification;

  @Input()
  userCertification: UserCertification = new UserCertification();

  @Input() 
  skillType: SkillType = SkillType.certification;

  @Output() setItemEvent = new EventEmitter<{ item: any }>();  

  @ViewChild('monthSelector') monthSelector?: ElementRef;

  private defaultDate = new Date(Date.now());
  currentDate: Date = new Date();

  private _selectedMonth: any = `${this.defaultDate.getFullYear()}-${this.defaultDate.getMonth() + 1}`;

  public get selectedMonth(): any {
    return moment(this._selectedMonth, 'YYYY-M').format('YYYY-MM');
  }

  public set selectedMonth(value: any) {
    this._selectedMonth = value;
  }

  certificateForm = new FormGroup({
    skillName: new FormControl(),
    description: new FormControl(),
    certificateNumber: new FormControl(),
    certificationDate: new FormControl(),
    certificationCenter: new FormControl(),
  });

  constructor(
    public service: CandidateUserProfileService,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private dialogHelper: DialogHelperService
  ) {
    this.certificateForm = new FormGroup({
      skillName: new FormControl(),
      description: new FormControl(),
      certificateNumber: new FormControl(),
      certificationDate: new FormControl(),
      certificationCenter: new FormControl(),
    });
  }

  chosenYearHandlerStart(
    normalizedYear: Date,
    datepicker: MatDatepicker<Date>
  ) {
    const ctrlValue = new Date(this.skill.certificationDate);
    ctrlValue.setFullYear(normalizedYear.getFullYear());

    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    this.skill.certificationDate = ctrlValue;
    this.cdr.markForCheck();
  }

  chosenMonthHandlerStart(
    normalizedMonth: Date,
    datepicker: MatDatepicker<Date>
  ) {
    const ctrlValue = new Date(this.skill.certificationDate);
    ctrlValue.setMonth(normalizedMonth.getMonth());
    if (ctrlValue > this.currentDate) {
      ctrlValue.setTime(this.currentDate.getTime());
    }
    this.skill.certificationDate = ctrlValue;
    datepicker.close();
    this.cdr.markForCheck();
  }

  removeItem(skill: UserCertification): void {
    console.log('removeItem', skill);
    console.log('this.model.certification', this.service.model.certification);
    const executeDelete = async (data: any) => {
      if (data) {
        const targetIndex = this.service.model.certification.findIndex(element => element.skillType == skill.skillType 
          && element.certificateNumber == skill.certificateNumber && element.certificationCenter == skill.certificationCenter 
          && element.skillName == skill.skillName);
        this.service.model.certification.splice(targetIndex, 1);
        console.log('this.model.certification', this.service.model.certification);
        this.cdr.markForCheck();
      }
    };
    this.dialogHelper.confirmationDialog(executeDelete);
  }
}
