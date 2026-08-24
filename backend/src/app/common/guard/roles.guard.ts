import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../constants';
import { ROLES } from '../enums';
import { UtilitiesService } from '../../modules/core/services/utilities.service';

@Injectable()
export class RolesGuard implements CanActivate {

  constructor(private readonly reflector: Reflector,
    private utilitiesService: UtilitiesService) { }

  canActivate(context: ExecutionContext): boolean {

    const requiredRoles = this.reflector.getAllAndOverride<ROLES[], any>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // console.log(requiredRoles);
    // console.log('class', context.getClass(), 'handler', context.getHandler().prototype, 'type', context.getType(), 'args', context.getArgs());
    // console.log(context.getHandler().prototype, context.getClass().name, context.getType(), context.getArgs());

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = this.utilitiesService.getUser(request);

    if (user?.role) {
      const requiredRoleKeys = requiredRoles?.map((role) => getEnumKeyByValue(ROLES, role)).filter(Boolean);
      const result = hasIntersection(requiredRoleKeys, user.role);
      return result;
    } else {
      throw new UnauthorizedException();
    }
  }
}

export function getEnumKeyByValue<T>(enumObj: T, value: string): keyof T | undefined {
  return Object.keys(enumObj).find((key) => enumObj[key as keyof T] === value) as keyof T | undefined;
}

export function hasIntersection(arr1: string[], arr2: string[]): boolean {
  const set1 = new Set(arr1.map(item => item.toLowerCase()));
  return arr2.some(item => set1.has(item.toLowerCase()));
}