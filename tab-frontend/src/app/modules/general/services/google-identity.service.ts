import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

declare const google: any;

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export interface GoogleButtonOptions {
  type?: 'standard' | 'icon';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
}

/**
 * Thin wrapper around Google Identity Services (GSI) — the "Sign in with
 * Google" button used by the login/registration forms. Loads the GSI script
 * once and renders the button, handing back the signature-verifiable
 * credential ID token for the caller to post to `auth/google`.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private scriptPromise?: Promise<void>;

  loadScript(): Promise<void> {
    if (typeof google !== 'undefined' && google?.accounts?.id) {
      return Promise.resolve();
    }
    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GSI_SCRIPT_URL}"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services script')));
        return;
      }

      const script = document.createElement('script');
      script.src = GSI_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }

  /** Loads the GSI script (if needed) and renders the button into `container`. */
  async renderButton(
    container: HTMLElement,
    onCredential: (idToken: string) => void,
    options: GoogleButtonOptions = {},
  ): Promise<void> {
    await this.loadScript();

    google.accounts.id.initialize({
      client_id: environment.socialLogin.GOOGLE.CLIENT_ID,
      callback: (response: { credential: string }) => onCredential(response.credential),
    });

    google.accounts.id.renderButton(container, {
      type: options.type || 'standard',
      theme: 'outline',
      size: 'large',
      width: options.width || 320,
      text: options.text || 'continue_with',
      shape: options.shape || 'pill',
    });
  }
}
