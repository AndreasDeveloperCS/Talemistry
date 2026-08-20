import { SetMetadata } from '@nestjs/common';
import { AccessType } from '../../permissions/models/access-type';
import { FunctionalBlock } from '../../permissions/models/functional-block';

export const ACCESS_KEY = 'access';
export const BLOCK_KEY = 'block';

export const Access = (accessType: AccessType, functionalBlock: FunctionalBlock) =>
    SetMetadata(ACCESS_KEY, accessType) && SetMetadata(BLOCK_KEY, functionalBlock);