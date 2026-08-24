import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DropDownFilterBaseComponent } from '../../../general/components/drop-down-filter-base/drop-down-filter-base.component';
import { Role } from '../../../permissions/models/role';
import { ContentService } from '../../../general/services/content.service';
import { SearchLogicService, Sorting } from '../../../general/services/search-logic.service';
import { RolesService } from '../../../permissions/services/roles.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { CandidateUserProfileService } from 'src/app/modules/expertise/services/candidate-user-profile.service';

@Component({
  selector: 'app-role-selection',
  standalone: false,
  templateUrl: './role-selection.component.html',
  styleUrl: './role-selection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleSelectionComponent extends DropDownFilterBaseComponent<Role> implements OnInit {

  @Input() 
  rolesList: any[] = [];

  @Input() 
  formControlName: string = 'role';
  
  @Output()
  public selectedRolesChange: EventEmitter<any[]> = new EventEmitter<any[]>();

  override selectedItem: Role = new Role();
  
  override get filterParams(): { column: string, value: any }[] {
    this._filterParams.splice(0, this._filterParams.length);
    this._filterParams.push({ column: getPropertyName<Role>((e: Role) => e.description), value: this.filterControl.value });
    return this._filterParams;
  }
  
  override sorting: Sorting = {
    property: getPropertyName<Role>((e: Role) => e.bitValue), direction: 'ASC'
  };

  constructor(public content: ContentService,
    searchLogicService: SearchLogicService,
    changeDetectorRef: ChangeDetectorRef,
    private rolesService: RolesService,
    public service: CandidateUserProfileService) {
    super(rolesService, changeDetectorRef, searchLogicService);
  }
  
  override ngOnInit(): void {
    super.ngOnInit();
    this.populateCollection();
    this.changeDetectorRef.markForCheck();
  }

  async add(rawInput: any) {
    const input = rawInput?.trim();

    console.log("this.inputControl: Role: ", input);

    if (this.filterControl.valid) {
      const role = input;
      const alreadyExists = this.rolesList.some(
        (role) => role === input || role === input.code
      );

      if (!alreadyExists) {
        this.rolesList.push(role);
        this.updateRoles();
      }
    }

    this.selectedItem = new Role();
    this.filterControl.setValue('');
  }

  remove(item: any) {
    this.rolesList = this.rolesList.filter(r => r !== item);
    console.log('AFTER DELETE this.rolesList', this.rolesList);
    this.updateRoles();
  }

  getValue(item: string) {
    return item;
  }

  updateRoles() {
    this.selectedRolesChange.emit(this.rolesList);
  }
}
