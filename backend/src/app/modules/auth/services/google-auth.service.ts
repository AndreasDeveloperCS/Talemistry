import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class GoogleAuthService {
  private readonly GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  private readonly GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  private readonly redirectUrl = 'http://localhost:4200';
  private readonly accessTokenUrl = 'https://oauth2.googleapis.com/token';
  private readonly phoneNumberApiUrl = 'https://people.googleapis.com/v1/people/me?personFields=phoneNumbers';
  private readonly googleUserInfoApiUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
  private client = new OAuth2Client(this.GOOGLE_CLIENT_ID);

  constructor(private readonly httpService: HttpService) { }

  // async validateGoogleToken(token: string) {
  //   console.log('Token', token);
  //   try {
  //     const ticket = await this.client.verifyIdToken({
  //       idToken: token,
  //       audience: this.GOOGLE_CLIENT_ID,
  //     });

  //     const userInfo = ticket.getPayload();
  //     if (!userInfo) {
  //       throw new Error('Invalid Google token');
  //     }

  //     console.log(userInfo);

  //     return userInfo;
  //   } catch (error) {
  //     throw new Error('Error validating Google token: ' + error.message);
  //   }
  // }

    async decodeIdToken(idToken: string): Promise<any> {
      try {
        const decodedToken = jwt.decode(idToken);
        return decodedToken;
      } catch (error) {
        console.error('Invalid ID Token');
      }
    }

  // async getAccessToken(code: string): Promise<any> {
  //   try {
  //     const accessTokenResponse = await firstValueFrom(
  //       this.httpService.post(`${this.accessTokenUrl}`, {
  //         code: code,
  //         client_id: this.GOOGLE_CLIENT_ID,
  //         client_secret: this.GOOGLE_CLIENT_SECRET,
  //         grant_type: 'authorization_code',
  //         redirect_uri: `${this.redirectUrl}`,
  //         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //       },
  //       )
  //     );
  //     const accessTokenInfo = accessTokenResponse.data;
  //     return accessTokenInfo;
  //   } catch (error) {
  //     console.error('Error getting access token', error);
  //     throw new Error('Error fetching access token');
  //   }
  // }

  // async fetchUserPhoneNumber(accessToken: string): Promise<string | null> {
  //   try {
  //     const response = await firstValueFrom(
  //       this.httpService.get(`${this.phoneNumberApiUrl}`, {
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //           'Accept': 'application/json'
  //         },
  //       })
  //     );
  //     const phoneNumbers = response.data?.phoneNumbers;
  //     return phoneNumbers && phoneNumbers.length > 0 ? phoneNumbers[0].value : null;
  //   } catch (error) {
  //     console.error('Error fetching user data', error);
  //     throw new Error('Failed to fetch user phone number');
  //   }
  // }

  // async fetchUserData(accessToken: string) {
  //   try {
  //     const response = await firstValueFrom(
  //       this.httpService.get(`${this.googleUserInfoApiUrl}`, {
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //           'Accept': 'application/json',
  //         },
  //       })
  //     );
  //     return response.data;
  //   } catch (error) {
  //     console.error('fetchUserData', error);
  //   }
  // }
}
