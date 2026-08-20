import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { User } from '../../users/models/user';

@Injectable()
export class UtilitiesService {
  public className = this.constructor.name;
  private passwordChars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  private codeChars = "0123456789";

  constructor(private readonly jwtService: JwtService) {

  }

  public generatePassword(passwordLength: number): string {
    let password = '';
    for (var i = 0; i <= passwordLength; i++) {
      var randomNumber = Math.floor(Math.random() * this.passwordChars.length);
      password += this.passwordChars.substring(randomNumber, randomNumber + 1);
    }
    return password
  }

  public generateOtpCode(passwordLength: number): string {
    let password = '';
    for (var i = 0; i <= passwordLength; i++) {
      var randomNumber = Math.floor(Math.random() * this.codeChars.length);
      password += this.codeChars.substring(randomNumber, randomNumber + 1);
    }
    return password
  }

  async hashPassword(password: string): Promise<string> {
    return await hash(password, 10);
  }

  async passwordCheck(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    const compareResult = await compare(password, hashedPassword);
    //console.log('', this.className, 'passwordCheck', password, hashedPassword, compareResult);
    return compareResult;
  }

  getUser(request: any): User {
    // console.log('utilities service', Date.now());
    try {
      const auth = request.rawHeaders;
      //console.log('request.rawHeaders', request.rawHeaders);
      const tokenBearer = auth.filter(item => item.includes("Bearer"));
      if (tokenBearer.length == 0) {
        return undefined;
      }

      const token = tokenBearer[0]?.split(' ')[1];

      const decodedToken: any = this.jwtService.decode(token);

      if (decodedToken != null && decodedToken?.user != undefined) {
        let user = decodedToken.user;
        //console.log('utilities service', token, user, decodedToken);
        return user;
      }

      if (decodedToken == null || decodedToken?.user == undefined) {
        console.error('Decoded token is null or user is undefined', decodedToken);
        return undefined;
      }

    } catch (ex) {
      console.error('getUser error', ex);
    }
  }

  public getDate(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  }
}
