import { IsArray, IsString } from 'class-validator';


export class  ChangePasswordDto{
  @IsString()
  oldPassword: string;

  @IsString()
  newPassword: string;

  @IsString()
  verificationCode: string;
  
  @IsString()
  email: string;
}
