import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { University } from '../../models/university';
import { UniversityService } from '../../services/university.service';
import { MatDialog } from '@angular/material/dialog';
import { UniversityFormComponent } from '../university-form/university-form.component';
import { TableTemplateComponent } from '../../../general/components/table-template/table-template.component';
import { DialogHelperService } from '../../../general/services/dialog-helper.service';
import { Filter, Sorting } from '../../../general/services/search-logic.service';
import { take } from 'rxjs';
import { NotificationWindowComponent } from 'src/app/modules/general/dialogs/notification-window/notification-window.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';

@Component({
  selector: 'app-universities-list',
  templateUrl: './universities-list.component.html',
  styleUrl: './universities-list.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UniversitiesListComponent extends TableTemplateComponent<University> implements OnInit {
  override currentComponentName = this.constructor.name;
  public selectedCountry: string = '';
  countries: string[] = [];
  entity: University = new University();

  public override sorting: Sorting = {
    property: 'country',
    direction: "ASC"
  }

  public override sortingProcessed: Sorting = {
    property: 'country',
    direction: "DESC"
  }

  public override headerNames: Map<string, string> = new Map<string, string>([
    ['name', 'NAME'], 
    ['country', 'COUNTRY'], 
    ['domains', 'DOMAINS'], 
    ['web_pages', 'WEB PAGES'], 
    ['alpha_two_code', 'CODE'], 
    ['stateProvince', 'PROVINCE'], 
    ['_id', 'ID']
  ]);

  public override displayedColumns: string[] = [
    'edit',
    'delete',
    'name',
    'country',
    'domains',
    'web_pages',
    'alpha_two_code',
    'stateProvince',
    '_id',
  ];
  
  constructor(private universityService: UniversityService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private dialogHelper: DialogHelperService,
    injector: Injector) {
    super(universityService, injector);
  }

  getAbsoluteLink(link: string) {
    return `https://${link}`;
  }

  override populateDropDownLists() {
    this.countries = this.data.items ? this.data.items?.map((item: any) => item._id) : [];
    this.countries.unshift("All");
    this.cdr.markForCheck();
  }

  countryChanged($event: any, column: string) {
    console.log('country changed', $event, column);
    const filterValue = $event.value;
    this.filtering = this.filtering.filter((filter: Filter) => filter.property !== 'country');

    if (filterValue != undefined && filterValue != null && filterValue != "All") {
      const newFilter = this.searchLogicService.getFilter(column, filterValue)
      if (newFilter)
        this.filtering.push(newFilter);
      this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
    } else {
      this.getList(this.selectedPageSize, this.pageIndex, this.sorting, this.filtering);
    }
  }

  create(): void {
    this.dialogHelper.openDialog(UniversityFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        this.universityService.createAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('University has been created', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "University has been created!" }
            });
            this.universityService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while creating the university', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while creating the university!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    });
  }

  edit(university: any): void {
    this.dialogHelper.openDialog(UniversityFormComponent, (result) => {
      if (result) {
        console.log('Create res', result);
        result._id = university._id;
        result.createdBy = university.createdBy;
        this.universityService.updateAsync(result, true, false).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('University has been updated', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "University has been updated!" }
            });
            this.universityService.refreshDataBehaviorSubject.next(true);
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while updating the university', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while updating the university!" }
            });
            this.cdr.markForCheck();
          }
        })
      }
    }, { data: university });
  }

  delete(university: any) {
    const executeDelete = (confirmed: boolean) => {
      if (confirmed) {
        console.log(`Attempting to delete university with ID: ${university._id}`);
        this.universityService.deleteAsync(university._id).pipe(take(1)).subscribe({
          next: (res) => {
            console.log('University has been deleted', res);
            this.dialog.open(NotificationWindowComponent, {
              data: { message: "University has been deleted!" }
            });
            this.cdr.markForCheck();
          }, error: (err) => {
            console.error('Error while deleting the university', err);
            this.dialog.open(WarningsErrorsDialogComponent, {
              data: { message: "Error while deleting the university!" }
            });
            this.cdr.markForCheck();
          }
        });
      } else {
        console.log('Delete action was cancelled');
      }
    }
    this.dialogHelper.confirmationDialog(executeDelete);
    this.cdr.markForCheck();
  }
}
