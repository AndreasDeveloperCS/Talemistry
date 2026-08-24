import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  id: string;

  @IsString()
  accessToken?: string;

  @IsString()
  refreshToken: string;
}
