export interface UserData {
  id: string;
  token: string;
  refreshToken: string
}

export interface SocialUserData {
  userData: UserData;
  socialUser: SocialUser;
}

export interface SocialUser {
  iss: string;
  aud: string;
  iat: string;
  exp: string;
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}