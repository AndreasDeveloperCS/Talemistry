import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AccessType } from '../../permissions/models/access-type';
import { FUNCTIONALBLOCK } from '../../permissions/models/functional-block-enum';
import { AccessService } from '../services/access.service';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[hasPermission]'
})
export class HasPermissionDirective {

  @Input() set hasPermission(value: { access: AccessType[]; block: FUNCTIONALBLOCK }) {
    const permission = this.authService.permissionCodeMap.get(value.block);
    if (this.accessService.hasAccess(permission, value.access)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }

  constructor(private authService: AuthService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private accessService: AccessService
  ) { }
}