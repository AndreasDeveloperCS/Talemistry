import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class LinkedInAuthService {
  private accessTokenLinkedIn = 'https://www.linkedin.com/oauth/v2/accessToken';
  private clientId = process.env.LINKEDIN_CLIENT_ID;
  private clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  private redirectUri = 'http://localhost:4200/career/auth/linkedin';

  constructor(private http: HttpService) {
  }

  async getAccessToken(code: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });
  
      const { data } = await firstValueFrom(this.http.post(this.accessTokenLinkedIn, params));
      return data;
    } catch (error) {
      console.error('Error fetching access token:', error.response?.data || error.message);
    }
  }

  async decodeIdToken(idToken: string): Promise<any> {
    try {
      const decodedToken = jwt.decode(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Invalid ID Token');
    }
  }

  // async refreshAccessToken(refreshToken: string): Promise<string> {
  //   const params = new URLSearchParams({
  //     grant_type: 'refresh_token',
  //     refresh_token: refreshToken,
  //     client_id: this.clientId,
  //     client_secret: this.clientSecret,
  //   });

  //   const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

  //   try {
  //     const response = await firstValueFrom(
  //       this.http.post(this.accessTokenLinkedIn, params.toString(), { headers })
  //     );
  //     return response.data.access_token;
  //   } catch (error) {
  //     console.error('Error refreshing access token:', error.response?.data || error.message);
  //     throw new Error('Failed to refresh LinkedIn access token');
  //   }
  // }
}
