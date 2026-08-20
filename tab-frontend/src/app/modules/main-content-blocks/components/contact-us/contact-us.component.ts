import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { LanguageStateService } from '../../../../services/language-state.service';
import { GeneralModule } from '../../../general/general.module';
import { ContactData, ContactForm, LocationHeadquarter } from '../../../general/models/contact-form';
import { FileData } from '../../../general/models/file-data';
import { ContactUsService } from '../../../general/services/contact-us.service';
import { ContentService } from '../../../general/services/content.service';
import { EmailService } from '../../../general/services/email.service';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss',
  standalone: true,
  imports: [CdkTextareaAutosize, GeneralModule,
    FormsModule, MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatOptionModule,
    NgxMatSelectSearchModule,
    MatInputModule,
    MatExpansionModule, MatIconModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactUsComponent implements OnInit, AfterContentChecked {
  @ViewChild('autosize') autosize: CdkTextareaAutosize | undefined;

  private emailRegx = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,5}$/;
  private phoneRegx = /^[+]?[\d]{0,3}[\s]?[(]?[\d]{1,3}[)]?[\s]?[\d\s]{7,12}$/;
  public data: ContactData = new ContactData();
  attachments: FileData[] = [];

  public isMessageSent: boolean = false;

  public headquartersList: LocationHeadquarter[] = [
    {
      country: "Greece",
      city: "Thessaloniki",
      address: "Karatasou 7, 546 26",
      mainEmail: "pavlos@evryka.org",
      email: "customers_services@evryka.org",
      phone: "+30 694 923 91 74"
    },
    {
      country: "Greece",
      city: "Athens",
      address: "Poseidonos 55, 175 62",
      mainEmail: "andreas@evryka.org",
      email: "customers_services@evryka.org",
      phone: "+30 697 198 42 85"
    }];

  public form!: FormGroup<ContactForm>;

  minRows: number = 15;
  maxRows: number = 15;
  rows: number = 11;

  constructor(public contactUsService: ContactUsService,
    private formBuilder: FormBuilder,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    public languageStateService: LanguageStateService,
    public content: ContentService,
    public emails: EmailService) {
    this.form = formBuilder.group<ContactForm>({
      contactName: new FormControl('', [Validators.required]),
      company: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email, Validators.pattern(this.emailRegx)]),
      phone: new FormControl('', [Validators.required, Validators.pattern(this.phoneRegx)]),
      message: new FormControl('', [Validators.required]),
    });

    this.data = new ContactData();
  }

  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.updateRows(window.innerWidth);
  }

  ngOnDestroy(): void {

  }

  ngAfterContentChecked() {
    this.changeDetectorRef.detectChanges();
  }

  get f() {
    return this.form.controls;
  }

  async onSubmitContactData() {
    if (this.form.valid) {

      this.data = {
        contactName: this.form.value.contactName,
        company: this.form.value.company,
        email: this.form.value.email,
        mainEmail: this.form.value.email,
        phone: this.form.value.phone,
        message: this.form.value.message
      };


      sessionStorage.setItem("contactData", JSON.stringify(this.data));

      try {

        await this.emails.sendEmailAsync(this.data);

        this.isMessageSent = true;


        setTimeout(() => {
          this.isMessageSent = false;
          this.resetContactUsDataForm();
          this.changeDetectorRef.markForCheck();
        }, 5000);

      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
      }
    }
  }

  resetContactUsDataForm() {
    this.form.reset();
  }

  @HostListener('window: resize', ['$event'])
  onresize(event: any): void {
    const target = event?.target as Window;
    this.updateRows(event.target.innerWidth);
  }


  updateRows(width: number): void {
    if (width <= 600) {
      this.minRows = 5;
      this.rows = 5;
      this.maxRows = 5;
    } else {
      this.minRows = 15;
      this.maxRows = 15;
      this.rows = 12;
    }
    this.changeDetectorRef.markForCheck();
  }

  onAttachmentsSelected($event: any) {

    const inputNodes: any = $event.srcElement;

    const attachments: FileData[] = [];

    if (typeof (FileReader) !== 'undefined') {

      for (let index = 0; index < inputNodes.files.length; index++) {

        const reader = new FileReader();

        reader.readAsArrayBuffer(inputNodes.files[index]);

        reader.onload = (node: any) => {

          // console.log('onload node', node);

          const attachment: FileData = {
            file: node.target.result,
            fileInfo: inputNodes.files[index],
            fileName: inputNodes.files[index]?.name
          }

          attachments.push(attachment);

          return node.target.result;
        }

        reader.onloadend = (node: any) => {

          // console.log('onloadend node', node);

          const attachment: FileData = {
            file: node.target.result,
            fileInfo: inputNodes.files[index],
            fileName: inputNodes.files[index]?.name
          }
          this.attachments.push(attachment);
        }
      }
    }
    this.changeDetectorRef.markForCheck()
  }

  removeAttachment(attachment: any) {
    // console.log(attachment);
    this.attachments = this.attachments.filter((element: FileData) => {
      return element.fileInfo.name !== attachment.fileInfo.name;
    });
  }

  bookMeeting() {
    this.router.navigate(['/contacts/booking-meeting']);
  }
}
