import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PositionData } from '../../models/position-data';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../../../environments/environment';
import { AuthGuardService } from '../../../authentication/guard/auth-guard.service';
import { FUNCTIONALBLOCK } from '../../../permissions/models/functional-block-enum';
import { CompanyVersionService } from 'src/app/modules/companies/services/company-version.service';
import { take } from 'rxjs';
import { CompanyVersion } from 'src/app/modules/companies/models/company';

@Component({
  selector: 'app-position-detailed-info',
  templateUrl: './position-detailed-info.component.html',
  styleUrl: './position-detailed-info.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionDetailedInfoComponent implements OnInit, AfterViewInit {
  @Input()
  positionData!: PositionData;

  @Input()
  isAuthorised: boolean = false;

  @Output()
  positionsListUpdated: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output() 
  scrollToApply = new EventEmitter<void>();

  private _titleCode: string = '';
  companyId: string = '';
  lblPositionTitle = "Position Title";
  companyLogo!: string | undefined;

  public get titleCode(): string {
    return this._titleCode;
  }

  public set titleCode(value: string) {
    this._titleCode = value;
  }
  
  public get canSetupInterview(): boolean {
    return this.authGuard.canViewShared(FUNCTIONALBLOCK.POSITIONS);
  }

  public get canEditItem(): boolean {
    return this.authGuard.canEditItem(FUNCTIONALBLOCK.POSITIONS);
  }
  
  get routerLink() {
    return `${this.positionData.position._id}`;
  }

  constructor(
    public authGuard: AuthGuardService, 
    private sanitizer: DomSanitizer, 
    private companyService: CompanyVersionService,
    private changeDetectorRef:ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
    this.companyId = this.positionData?.companyId;
    if(this.companyId) {
      this.getCompanyInfo();
    }
  }

  getCompanyInfo() {
    this.companyService
      .getByIdAsync(this.companyId, true)
      .pipe(take(1))
      .subscribe({
        next: (res: CompanyVersion) => {
          console.log('Company:', res);
          if(res) {
            this.companyLogo = res.data?.companyLogo?.imagePath;
            this.changeDetectorRef.markForCheck();
          }
        }, error: (err) => {
          console.error('Error getting the company by id', err);
          this.changeDetectorRef.markForCheck();
        }
      });

    window.scrollTo(0, 0);
  }
  
  apply() {
    this.scrollToApply.emit();
  }

  onCompanyPage(companyId: string) {
    if(companyId) {
      this.companyService.openCompanyPage(companyId);
    }
  }

  sanitizeHTML(html: string): SafeHtml {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));

    doc.querySelectorAll('style, script').forEach(el => el.remove());

    doc.querySelectorAll('ul').forEach(ul => ul.classList.add('custom-list'));

    doc.querySelectorAll('h2').forEach(h2 => {
      const h3 = doc.createElement('h3');
      h3.classList.add('custom-h3');

      [...h2.attributes].forEach(attr => {
        h3.setAttribute(attr.name, attr.value);
      });

      while (h2.firstChild) {
        h3.appendChild(h2.firstChild);
      }

      h2.replaceWith(h3);
    });

    return this.sanitizer.bypassSecurityTrustHtml(doc.body.innerHTML);
  }
}