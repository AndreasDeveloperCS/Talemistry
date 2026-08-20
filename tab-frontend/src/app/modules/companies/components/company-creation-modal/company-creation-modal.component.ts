import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Currency } from '../../../general/models/currency';
import { ContentService } from '../../../general/services/content.service';
import { Subject, takeUntil } from 'rxjs';
import { getCity, getCountry } from '../../../../../shared-functions/location-helpers';
import { GetCurrecntIpService } from '../../../general/services/get-currecnt-ip.service';
import { CompanyVersionService } from '../../services/company-version.service';
import { City } from '../../../location/models/city';
import { Country } from '../../../location/models/country';
import { IndustryDomain } from '../../../industries/models/industry';
import { CompanyValue } from '../../models/company-values';
import { CompanyBenefit } from '../../models/company-benefits';
import { CompanyVersion, CompanyVersionDialogResult } from '../../models/company';
import { FileData } from 'src/app/modules/general/models/file-data';

@Component({
  selector: 'app-company-creation-modal',
  templateUrl: './company-creation-modal.component.html',
  styleUrls: ['./company-creation-modal.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyCreationModalComponent implements OnInit, OnDestroy {
  companyForm: FormGroup;
  protected _onDestroy = new Subject<void>();
  public inputProfileImageTypes = ['.jpg', '.png', '.bmp', '.jpeg'];
  public fileName = '';
  fileData: FileData = {};
  selectedFile: any;
  imgSrc!: string;
  isSelectedProfileImage!: boolean;
  controlButtonContent: string = "";
  isEdit: boolean = false;
  companyVersion: CompanyVersion = new CompanyVersion();

  public get extensions() {
    return `${this.inputProfileImageTypes}`;
  }

  constructor(fb: FormBuilder,
    public content: ContentService,
    private currentIpService: GetCurrecntIpService,
    private companyVersionService: CompanyVersionService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<CompanyCreationModalComponent>,
    @Inject(MAT_DIALOG_DATA) 
    public data: CompanyVersion
  ) {
    console.log('Company', data);

    this.companyForm = fb.group({
      companyName: [data?.data?.companyName || null, Validators.required],
      shortDescription: [data?.data?.shortDescription || null, Validators.required],
      companyLogo: [data?.data?.companyLogo || null],
      icon: [data?.data?.logo || null],
      mainIndustryDomain: [data?.data?.mainIndustryDomain || null, Validators.required],
      industryCategories: [data?.data?.industryCategories || [], Validators.required],
      country: [data?.data?.country?.name || null, Validators.required],
      city: [data?.data?.city?.name || null, Validators.required],
      companyType: [data?.data?.companyType || null, Validators.required],
      companySize: [data?.data?.companySize || null, Validators.required],
      companySizeRange: [data?.data?.companySizeRange || null, Validators.required],
      companyRevenue: [data?.data?.companyRevenue || null, Validators.required],
      currency: [data?.data?.currency || null, Validators.required],
      companySite: [data?.data?.companySite || null, Validators.required],
      registrationNumber: [data?.data?.registrationNumber || null, Validators.required],
      taxNumber: [data?.data?.taxNumber || null, Validators.required],
      managerContacts: [data?.data?.managers || null],
      companyEmail: [data?.data?.companyEmail || null, Validators.required],
      companyPhone: [data?.data?.companyPhone || null, Validators.required],
      companyBenefits: [data?.data?.companyBenefits || []],
      companyValues: [data?.data?.companyValues || []],
    });

    this.isEdit = this.data != undefined;
    console.log('CompanyData', data);

    if (data?.data?.industryCategories?.length > 0) {
      console.log('data?.data?.industryCategories.length', data?.data?.industryCategories.length);
      this.companyVersionService.model.industryCategories = data?.data?.industryCategories;
    } else {
      this.companyVersionService.model.industryCategories = [];
    }

    if (data?.data?.companyBenefits && data?.data?.companyBenefits?.length > 0) {
      console.log('data?.data?.companyBenefits.length', data?.data?.companyBenefits?.length);
      this.companyVersionService.model.companyBenefits = data?.data?.companyBenefits;
    } else {
      this.companyVersionService.model.companyBenefits = [];
    }

    if (data?.data?.companyValues && data?.data?.companyValues?.length > 0) {
      console.log('data?.data?.companyValues.length', data?.data?.companyValues.length);
      this.companyVersionService.model.companyValues = data?.data?.companyValues;
    } else {
      this.companyVersionService.model.companyValues = [];
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

    this.initializeDefaultValue(this.data);
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  initializeDefaultValue(data: CompanyVersion) {
    if(data) {
      this.companyVersion = data;
    }
  }

  onCurrencySelected(currency: any) {
    this.companyForm.get('currency')?.setValue(currency);
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
    this.companyForm.get('mainIndustryDomain')?.setValue(model.mainIndustryDomain);
    this.companyForm.get('industryCategories')?.setValue(model.industryCategories);
    console.log('companyForm', this.companyForm.value);
  }

  onCompanyValueSelected(companyValue: CompanyValue | any) {
    console.log('Company Values', this.companyVersionService.model.companyValues);
    this.companyForm.get('companyValues')?.setValue(this.companyVersionService.model.companyValues);
    console.log('companyForm', this.companyForm.value);
  }

  onCompanyBenefitSelected(companyBenefit: CompanyBenefit | any) {
    console.log('Company Benefits', this.companyVersionService.model.companyBenefits);
    this.companyForm.get('companyBenefits')?.setValue(this.companyVersionService.model.companyBenefits);
    console.log('companyForm', this.companyForm.value);
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

  save(): void {
    if (this.companyForm.valid) {
      const companyDialogResult : CompanyVersionDialogResult = {
        companyInfo: {
          ...this.companyForm.getRawValue()
        },
        fileData: this.fileData
      }
      this.dialogRef.close(companyDialogResult);
    }
  }

  preventMinus(event: KeyboardEvent) {
    if (event.key === '-' || event.key === 'Minus') {
      event.preventDefault();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
