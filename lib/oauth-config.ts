export type PlatformType = 'meta' | 'google' | 'shopify';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  apiUrl: string;
  scopes: string[];
}

export const OAUTH_CONFIGS: Record<PlatformType, OAuthConfig> = {
  meta: {
    clientId: process.env.META_APP_ID || '',
    clientSecret: process.env.META_APP_SECRET || '',
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.instagram.com/v18.0/oauth/access_token',
    apiUrl: 'https://graph.instagram.com/v18.0',
    scopes: [
      'ads_management',
      'business_management',
      'instagram_basic',
    ],
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiUrl: 'https://www.googleapis.com',
    scopes: [
      'https://www.googleapis.com/auth/adwords',
      'https://www.googleapis.com/auth/analytics.readonly',
    ],
  },
  shopify: {
    clientId: process.env.SHOPIFY_API_KEY || '',
    clientSecret: process.env.SHOPIFY_API_SECRET || '',
    authorizationUrl: 'https://{shop}/admin/oauth/authorize',
    tokenUrl: 'https://{shop}/admin/oauth/access_token',
    apiUrl: 'https://{shop}/admin/api',
    scopes: ['read_orders', 'read_products', 'read_analytics'],
  },
};

export const getOAuthConfig = (platform: PlatformType): OAuthConfig => {
  const config = OAUTH_CONFIGS[platform];
  if (!config.clientId || !config.clientSecret) {
    throw new Error(`Missing OAuth credentials for ${platform}`);
  }
  return config;
};

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
    ...additionalParams,
  });

  // Add platform-specific scopes
  if (platform === 'meta') {
    params.set('scope', 'ads_management,business_management');
    params.set('display', 'popup');
  } else if (platform === 'google') {
    params.set('scope', 'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email');
    params.set('access_type', 'offline');
  } else if (platform === 'shopify') {
    params.set('scope', 'read_products,read_orders,write_products');
  }

  return `${authorizationUrl}?${params.toString()}`;
}

export interface OAuthState {
  platform: PlatformType;
  userId: string;
  timestamp: number;
  nonce: string;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType: string;
}

export interface PlatformConnection {
  id: string;
  userId: string;
  platform: PlatformType;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  status: 'active' | 'expired' | 'revoked';
  connectedAt: string;
  lastSyncedAt?: string;
  metadata?: Record<string, any>;
}
