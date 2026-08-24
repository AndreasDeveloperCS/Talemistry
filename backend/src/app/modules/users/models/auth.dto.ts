import { IsArray, IsBoolean, IsString } from 'class-validator';
import { ROLES } from '../../../common/enums';
import { Column } from 'typeorm';
import { Prop } from '@nestjs/mongoose';

export class UserDto {

  @IsString()
  firstname: string;

  @IsString()
  lastname: string;

  @IsString()
  email: string;

  @IsString()
  @Column({ name: 'phone' })
  @Prop({ name: 'phone', required: false, default: "" })
  phone: string;

  @IsString()
  password?: string;

  @IsArray()
  role: ROLES[];

  @IsBoolean()
  isSocialUser?: boolean = false;
}
