import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY } from '../common/constants';
import { ROLES } from '../common/enums';

export const Roles = (...roles: ROLES[]) => SetMetadata(ROLES_KEY, roles);
