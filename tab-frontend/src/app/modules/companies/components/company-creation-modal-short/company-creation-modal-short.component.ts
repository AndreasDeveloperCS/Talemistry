import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { getCity, getCountry } from '../../../../../shared-functions/location-helpers';
import { ContentService } from '../../../general/services/content.service';
import { GetCurrecntIpService } from '../../../general/services/get-currecnt-ip.service';
import { IndustryDomain } from '../../../industries/models/industry';
import { City } from '../../../location/models/city';
import { Country } from '../../../location/models/country';
import { CompanyData, CompanyVersion, CompanyVersionDialogResult } from '../../models/company';
import { CompanyVersionService } from '../../services/company-version.service';
import { CompanyCreationModalComponent } from '../company-creation-modal/company-creation-modal.component';
import { DialogHelperService } from 'src/app/modules/general/services/dialog-helper.service';
import { FileData } from 'src/app/modules/general/models/file-data';

@Component({
  selector: 'app-company-creation-modal-short',
  templateUrl: './company-creation-modal-short.component.html',
  styleUrl: './company-creation-modal-short.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyCreationModalShortComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  companyForm!: FormGroup;
  controlButtonContent: string = "";
  isEdit: boolean = false;
  userId = sessionStorage.getItem(`${environment.storage.userId}`) ?? '';
  public inputProfileImageTypes = ['.jpg', '.png', '.bmp', '.jpeg'];
  public fileName = '';
  fileData: FileData = {};
  selectedFile: any;
  imgSrc!: string;
  isSelectedProfileImage!: boolean;
  companyVersion: CompanyVersion = new CompanyVersion();

  public get extensions() {
    return `${this.inputProfileImageTypes}`;
  }

  constructor(private fb: FormBuilder,
    private dialogHelper: DialogHelperService,
    private companyVersionService: CompanyVersionService,
    public content: ContentService,
    private currentIpService: GetCurrecntIpService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<CompanyCreationModalShortComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: CompanyVersion) {

    this.isEdit = data != undefined;

    this.companyForm = this.fb.group({
      companyName: [data?.data.companyName || null, Validators.required],
      shortDescription: [data?.data.shortDescription || null],
      mainIndustryDomain: [data?.data?.mainIndustryDomain || null, Validators.required],
      industryCategories: [data?.data?.industryCategories || [], Validators.required],
      country: [data?.data?.country?.name || null, Validators.required],
      city: [data?.data?.city?.name || null, Validators.required],
    });

    console.log('CompanyData', data);

    if (data?.data?.industryCategories.length > 0) {
      console.log('data?.data?.industryCategories.length', data?.data?.industryCategories.length);
      this.companyVersionService.model.industryCategories = data?.data?.industryCategories;
      this.companyVersionService.model.mainIndustryDomain = data?.data?.industryCategories[0];
    }

    this.controlButtonContent = this.isEdit ? this.content.txtUpdate : this.content.txtCreate;
  }

  ngOnInit(): void {
    this.currentIpService.getCurrentInfoModel().pipe(takeUntil(this._onDestroy)).subscribe((info: any) => {
      if (this.companyForm.value.country === null) {

        const country = getCountry(info)
        const city = getCity(info);
        this.companyForm.get('country')?.setValue(country);
        this.companyForm.get('city')?.setValue(city);

        console.log('Country object:', country);
        console.log('City object:', city);
      }
      else {
        this.companyForm.get('city')?.setValue(this.data?.data?.city);
        this.companyForm.get('country')?.setValue(this.data?.data?.country);
      }
      this.cdr.markForCheck();
    });
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onFileSelected(event: any) {
    console.log('onFileSelected event', event.srcElement);
    const inputNode: any = event.srcElement;

    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();

      reader.onload = (node: any) => {
        this.fileData = {
          file: node.target.result,
          fileInfo: inputNode.files[0],
          fileName: inputNode.files[0].name,
        };
        this.companyVersion.data.logo = inputNode.files[0].name;
        this.selectedFile = node.target.result;
        this.imgSrc = URL.createObjectURL(inputNode.files[0]);
      };

      this.fileName = inputNode.files[0].name;
      this.isSelectedProfileImage =
        this.fileName != undefined && this.fileName != null;
      reader.readAsText(inputNode.files[0]);
    }
  }

  onSubmit() {
    // console.log('this.companyForm', this.companyForm.value);
    // if (this.companyForm.valid) {
    //   const company = this.companyForm.getRawValue();
    //   console.log("Company before save", company);
    //   this.dialogRef.close(company);
    // }
    if (this.companyForm.valid) {
      const companyDialogResult : CompanyVersionDialogResult = {
        companyInfo: {
          ...this.companyForm.value
        },
        fileData: this.fileData
      }
      this.dialogRef.close(companyDialogResult);
    }
  }

  onCountrySelected(country: Country) {
    this.companyForm.get('country')?.setValue(country);
  }

  onCitySelected(city: City) {
    this.companyForm.get('city')?.setValue(city);
  }

  onIndustryDomainSelected(industryDomain: IndustryDomain[] | IndustryDomain | string | null | any) {
    console.log('Industries', this.companyVersionService.model.industryCategories);
    console.log('Main Industry', this.companyVersionService.model.mainIndustryDomain);

    const model = this.companyVersionService.model;
    if (model.industryCategories.length > 0) {
      this.companyVersionService.model.mainIndustryDomain = model.industryCategories[0];
    }
    this.companyForm.get('mainIndustryDomain')?.setValue(model.industryCategories[0]);
    this.companyForm.get('industryCategories')?.setValue(model.industryCategories);
    console.log('companyForm', this.companyForm.value);
  }

  onFullForm() {
    this.dialogHelper.openDialog(CompanyCreationModalComponent, (fullFormResult: any) => {
      if (fullFormResult) {
        this.dialogRef.close(fullFormResult);
      }
    }, { data: this.data });
  }

  onCancel() {
    this.companyVersionService.model = new CompanyData();
    this.companyForm.reset();
    this.cdr.markForCheck();
    this.dialogRef.close();
  }
}