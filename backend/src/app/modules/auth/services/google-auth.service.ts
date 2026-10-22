import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { OAuth2Client } from 'google-auth-library';

/** Normalized Google profile, derived from a signature-verified ID token. */
export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
}

/** The `state` payload we round-trip through Google during the redirect flow. */
export interface GoogleOAuthState {
  returnUrl?: string;
}

const STATE_PURPOSE = 'google_oauth_state';
const STATE_TTL = '10m';

@Injectable()
export class GoogleAuthService {
  private readonly GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  private readonly GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  private readonly client = new OAuth2Client({
    clientId: this.GOOGLE_CLIENT_ID,
    clientSecret: this.GOOGLE_CLIENT_SECRET,
  });

  constructor(private readonly jwtService: JwtService) { }

  /**
   * Redirect URI used for the server-side authorization-code flow. Must
   * exactly match an "Authorized redirect URI" configured in the Google Cloud
   * Console OAuth client (see GOOGLE_REDIRECT_URI in .env).
   */
  resolveRedirectUri(request: Request): string {
    if (process.env.GOOGLE_REDIRECT_URI) {
      return process.env.GOOGLE_REDIRECT_URI;
    }
    return `${request.protocol}://${request.get('host')}/auth/google/callback`;
  }

  /** Build the URL that starts the Google OAuth consent flow. */
  getAuthorizationUrl(state: string, redirectUri: string): string {
    return this.client.generateAuthUrl({
      redirect_uri: redirectUri,
      scope: ['openid', 'email', 'profile'],
      state,
      prompt: 'select_account',
    });
  }

  /** Exchange an authorization `code` (redirect flow) for Google tokens. */
  async exchangeCode(code: string, redirectUri: string) {
    const { tokens } = await this.client.getToken({ code, redirect_uri: redirectUri });
    if (!tokens?.id_token) {
      throw new UnauthorizedException('Google did not return an ID token');
    }
    return tokens;
  }

  /**
   * Verify a Google-issued ID token (signature, audience and issuer) and
   * return a normalized profile. Used by both the redirect flow (after
   * exchanging the code) and the client-side "Sign in with Google" button
   * flow (which posts the credential ID token directly).
   */
  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    if (!idToken) {
      throw new UnauthorizedException('Missing Google ID token');
    }

    let payload;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token: ' + (error as Error).message);
    }

    if (!payload?.sub || !payload?.email) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: !!payload.email_verified,
      name: payload.name,
      givenName: payload.given_name,
      familyName: payload.family_name,
      picture: payload.picture,
    };
  }

  /** Sign a short-lived, tamper-proof `state` value (CSRF protection; no server-side storage needed). */
  createState(payload: GoogleOAuthState): string {
    return this.jwtService.sign({ ...payload, purpose: STATE_PURPOSE }, { expiresIn: STATE_TTL });
  }

  /** Verify and decode a `state` value produced by {@link createState}. */
  verifyState(state: string | undefined): GoogleOAuthState {
    if (!state) return {};
    try {
      const payload: any = this.jwtService.verify(state);
      if (payload?.purpose !== STATE_PURPOSE) return {};
      return { returnUrl: payload.returnUrl };
    } catch {
      return {};
    }
  }
}
