import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, Subject, take, takeUntil } from 'rxjs';
import { AccessType } from '../../models/access-type';
import { FunctionalBlock } from '../../models/functional-block';
import { FUNCTIONALBLOCK } from '../../models/functional-block-enum';
import { Permission } from '../../models/permission';
import { Role } from '../../models/role';
import { AccessTypesService } from '../../services/access-types.service';
import { FunctionalBlocksService } from '../../services/functional-blocks.service';
import { PermissionsService } from '../../services/permissions.service';
import { RolesService } from '../../services/roles.service';
import { Filtering, SearchLogicService, Sorting } from '../../../general/services/search-logic.service';
import { getPropertyName } from '../../../../../shared-functions/shared-functions';
import { ContentService } from '../../../general/services/content.service';
import { NotificationWindowComponent } from '../../../general/dialogs/notification-window/notification-window.component';
import { WarningsErrorsDialogComponent } from 'src/app/modules/general/components/warnings-errors-dialog/warnings-errors-dialog.component';

@Component({
  selector: 'app-permissions-list',
  standalone: false,
  templateUrl: './permissions-list.component.html',
  styleUrl: './permissions-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionsListComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();

  permissions: Record<string, Record<string, number>> = {};
  selectedRole!: Role;
  filtering: Filtering = [];

  roles: Role[] = [];
  functionalBlocks: FunctionalBlock[] = [];
  accessTypes: AccessType[] = [];

  public sorting: Sorting = {
    property: getPropertyName<Role>((e: Role) => e.registerValue),
    direction: "ASC"
  }

  public sortingProcessed: Sorting = {
    property: getPropertyName<Role>((e: Role) => e.registerValue),
    direction: "DESC"
  }

  blocksCodeMap: Map<string, FunctionalBlock> = new Map<string, FunctionalBlock>();
  blocksIdMap: Map<string, FunctionalBlock> = new Map<string, FunctionalBlock>();
  permissionsItems: Permission[] = [];

  constructor(
    public roleService: RolesService,
    public fbServces: FunctionalBlocksService,
    public atServcie: AccessTypesService,
    public permissionServce: PermissionsService,
    public content: ContentService,
    private cdr: ChangeDetectorRef,
    private searchLogic: SearchLogicService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    const filterIsActiveRole = this.searchLogic.getFilter(getPropertyName<Role>((e: Role) => e.isActive), true);
    const filterIsActiveFunctionalBlock = this.searchLogic.getFilter(getPropertyName<FunctionalBlock>((e: FunctionalBlock) => e.isActive), true);
    const filterIsActiveAccessType = this.searchLogic.getFilter(getPropertyName<AccessType>((e: AccessType) => e.isActive), true);

    const roles$ = this.roleService.getAllAsync(100, 0, this.sorting, [filterIsActiveRole], true, false);
    const blocks$ = this.fbServces.getAllAsync(100, 0, this.sorting, [filterIsActiveFunctionalBlock], true, false);
    const access$ = this.atServcie.getAllAsync(100, 0, this.sorting, [filterIsActiveAccessType], true, false);

    forkJoin([roles$, blocks$, access$]).pipe(takeUntil(this._onDestroy)).subscribe(
      ([rolesResponse, blocksResponse, accessResponse]: [any, any, any]) => {

        this.roles = rolesResponse.items;
        this.functionalBlocks = blocksResponse.items;
        this.accessTypes = accessResponse.items;

        this.blocksIdMap = convertArrayToIdMap(this.functionalBlocks);
        this.blocksCodeMap = convertArrayToCodeMap(this.functionalBlocks);

        this.selectedRole = this.roles[0];
        console.log('ngOnInit permission', this.selectedRole, this.permissions);
        if (this.selectedRole != undefined) {
          this.populateCurrentPermissions(this.selectedRole);
        }
        this.cdr.markForCheck();
      }
    );
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  populateCurrentPermissions(role: Role): void {
    this.permissions[role.code] = {};
    const filter = this.searchLogic.getFilter(getPropertyName<Permission>((e: Permission) => e.roleId), `=${role._id}`);
    console.log('filter', filter);
    this.permissionServce
      .getAllAsync(100, 0, this.sorting, [filter], true, false)
      .pipe(take(1))
      .subscribe((permissionsResponse: any) => {
        this.permissionsItems = permissionsResponse.items;
        console.log('permissionsResponse', permissionsResponse);
        this.permissions[role.code] = convertRolePermissionArrayToNestedMap(this.permissionsItems, this.blocksIdMap);
        console.log('this.permissions', this.permissions);

        const permissionMap = new Map<string, Map<string, Permission>>();
        this.permissionsItems.forEach((item: Permission) => {
          if (!permissionMap.has(item.roleId)) {
            permissionMap.set(item.roleId, new Map());
          }
          permissionMap.get(item.roleId)!.set(item.functionalBlockId, item);
        });

        this.functionalBlocks.forEach((block: FunctionalBlock) => {
          const roleMap = permissionMap.get(role._id);
          const permission = roleMap?.get(block._id);
          this.permissions[role.code][block.code] = permission?.numberValue ?? 0;
        });
        this.cdr.markForCheck();
      });
  }

  isAccessAllowed(roleCode: string, blockCode: string, accessBitIndex: number): boolean {
    const bitmask = this.permissions[roleCode][blockCode];
    return (bitmask & (1 << accessBitIndex)) !== 0;
  }

  togglePermission(role: Role, block: FunctionalBlock, bit: number) {
    this.permissions[role.code][block.code] ^= bit;
    console.log(this.permissions[role.code][block.code], role, block, bit);
  }

  hasPermission(role: Role, block: FunctionalBlock, bit: number): boolean {
    return (this.permissions[role.code][block.code] & bit) === bit;
  }

  hasAllPermissions(role: Role, block: FunctionalBlock): boolean {
    const current = this.permissions[role.code][block.code];
    const fullMask = this.accessTypes.reduce((mask, a) => mask | a.numberValue, 0);
    return (current & fullMask) === fullMask;
  }

  toggleAllPermissions(role: Role, block: FunctionalBlock): void {
    const current = this.permissions[role.code][block.code];
    const fullMask = this.accessTypes.reduce((mask, a) => mask | a.numberValue, 0);
    const hasAll = (current & fullMask) === fullMask;

    this.permissions[role.code][block.code] = hasAll ? 0 : fullMask;
  }

  selectRole(role: Role): void {
    this.selectedRole = role;
    this.populateCurrentPermissions(role);
  }

  onSave(): void {
    console.log('Saved permissions:', this.permissions, this.functionalBlocks, this.accessTypes, this.selectedRole);
    const userID = sessionStorage.getItem('userID');

    if (!this.selectedRole) {
      return;
    }

    const savingPermissions: Permission[] = convertNestedMapToPermissionArray(this.permissions, this.blocksCodeMap, this.selectedRole, userID);
    console.log('savingPermissions', savingPermissions);
    
    this.permissionServce.bulkUpdateAsync(savingPermissions, this.selectedRole._id, true, false)
      .pipe(take(1)).subscribe({
        next: (res) => {
          console.log('Changes have been saved!', res);
          this.dialog.open(NotificationWindowComponent, {
            data: { message: "Changes have been saved!" }
          });
          this.permissionServce.refreshDataBehaviorSubject.next(true);
          this.cdr.markForCheck();
        }, error: (err) => {
          console.error('Error saving changes!', err);
          this.dialog.open(WarningsErrorsDialogComponent, {
            data: { message: "Error saving changes!" }
          });
          this.cdr.markForCheck();
        }
      });
  }
}

export function convertArrayToIdMap<T extends { code: string, _id: any }>(array: T[]): Map<string, T> {
  return new Map(array.map(item => [item._id, item]));
}

export function convertArrayToCodeMap<T extends { code: string, _id: any }>(array: T[]): Map<string, T> {
  return new Map(array.map(item => [item.code, item]));
}

export function convertNestedMapToPermissionArray(data: Record<string, Record<string, number>>,
  blocksMap: Map<string, FunctionalBlock>,
  selectedRole: Role, userID: any): Permission[] {
  const result: Permission[] = [];
  const blocks = data[selectedRole.code];
  const roleID = selectedRole._id;

  Object.entries(blocks).forEach(([functionalBlockCode, bitMask]) => {
    const permission: Permission = new Permission();
    permission.roleId = roleID;
    permission.roleCode = selectedRole.code;
    permission.functionalBlockCode = FUNCTIONALBLOCK[functionalBlockCode as keyof typeof FUNCTIONALBLOCK];
    permission.functionalBlockId = blocksMap?.get(functionalBlockCode)?._id;
    permission.bitValue = bitMask;
    permission.numberValue = bitMask;
    permission.isActive = true;
    permission.modifiedBy = userID;
    result.push(permission);
  });

  return result;
}

export function convertRolePermissionArrayToNestedMap(
  permissions: Permission[],
  blocksMap: Map<string, FunctionalBlock>
): Record<string, number> {
  const result: Record<string, number> = {};
  console.log(blocksMap);
  permissions.forEach((perm: Permission) => {
    //console.log('perm', perm, blocksMap);
    const blockCode = blocksMap.get(perm.functionalBlockId)?.code;

    if (!blockCode) {
      return;
    }

    result[blockCode] = perm.numberValue ?? 0;
  });

  return result;
}