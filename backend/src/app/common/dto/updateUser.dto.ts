import { IsArray, IsOptional, IsString } from 'class-validator';

import { ROLES } from '../enums';

export class UpdateUserDTO {
  @IsString()
  firstname: string;

  @IsString()
  lastname: string;

  @IsString()
  email: string;

  @IsArray()
  role: ROLES[];
}
