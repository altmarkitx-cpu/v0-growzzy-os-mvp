import { OAuthState } from './oauth-config';

const OAUTH_STATE_STORAGE_KEY = 'oauth_state_';

export function generateOAuthState(platform: string, userId: string): string {
  const nonce = Math.random().toString(36).substring(2, 15);
  const state: OAuthState = {
    platform: platform as any,
    userId,
    timestamp: Date.now(),
    nonce,
  };
  
  // Store state in memory (in production, use Redis or database)
  const stateString = JSON.stringify(state);
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY + nonce, stateString);
  }
  
  return nonce;
}

export function createOAuthStateSession(state: string, userId: string): void {
  const oauthState: OAuthState = {
    platform: 'meta' as any,
    userId,
    timestamp: Date.now(),
    nonce: state,
  };
  
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY + state, JSON.stringify(oauthState));
  }
}

export function verifyOAuthState(nonce: string): OAuthState | null {
  if (typeof window === 'undefined') return null;
  
  const stateString = sessionStorage.getItem(OAUTH_STATE_STORAGE_KEY + nonce);
  if (!stateString) return null;
  
  try {
    const state = JSON.parse(stateString) as OAuthState;
    // Check if state is not older than 10 minutes
    if (Date.now() - state.timestamp > 10 * 60 * 1000) {
      sessionStorage.removeItem(OAUTH_STATE_STORAGE_KEY + nonce);
      return null;
    }
    return state;
  } catch (e) {
    return null;
  }
}

export function buildOAuthUrl(
  platform: string,
  authorizationUrl: string,
  clientId: string,
  redirectUri: string,
  state: string,
  additionalParams?: Record<string, string>
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    scope: additionalParams?.scope || 'ads_management',
    ...additionalParams,
  });

  return `${authorizationUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  tokenUrl: string,
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<any> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

export function encryptToken(token: string, key: string): string {
  // In production, use proper encryption like libsodium or TweetNaCl
  return Buffer.from(token).toString('base64');
}

export function decryptToken(encrypted: string, key: string): string {
  // In production, use proper decryption
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}
