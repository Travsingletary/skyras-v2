/**
 * Google OAuth 2.0 service for Calendar API access
 * Handles authorization flow, token storage, and refresh
 */

import { google } from 'googleapis';
import { encrypt, decrypt } from '@/lib/encryption';
import { googleOAuthTokensDb } from '@/lib/database';
import type { GoogleOAuthToken } from '@/types/database';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

/**
 * Get OAuth2 client with credentials from environment
 */
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in environment variables.'
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate authorization URL for OAuth flow
 * Returns URL that user should be redirected to for authorization
 *
 * @param userId - User ID to include in state parameter
 * @returns Authorization URL
 */
export function getAuthorizationUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();

  // State parameter for CSRF protection - includes userId
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: CALENDAR_SCOPE,
    state,
    prompt: 'consent', // Force consent screen to ensure we get refresh token
  });

  return authUrl;
}

/**
 * Handle OAuth callback - exchange authorization code for tokens
 * Encrypts and stores tokens in database
 *
 * @param code - Authorization code from callback
 * @param state - State parameter from callback (contains userId)
 * @returns User ID from state
 */
export async function handleCallback(code: string, state: string): Promise<string> {
  // Verify and parse state
  let stateData: { userId: string; timestamp: number };
  try {
    const stateJson = Buffer.from(state, 'base64').toString('utf8');
    stateData = JSON.parse(stateJson);
  } catch (error) {
    throw new Error('Invalid state parameter');
  }

  const { userId, timestamp } = stateData;

  // Verify state is not too old (15 minutes)
  const fifteenMinutes = 15 * 60 * 1000;
  if (Date.now() - timestamp > fifteenMinutes) {
    throw new Error('Authorization session expired. Please try again.');
  }

  // Exchange code for tokens
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain tokens from Google');
  }

  // Calculate expiry time
  const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));

  // Encrypt tokens
  const accessTokenEncrypted = encrypt(tokens.access_token);
  const refreshTokenEncrypted = encrypt(tokens.refresh_token);

  // Check if user already has tokens
  const existingToken = await googleOAuthTokensDb.getByUserId(userId);

  if (existingToken) {
    // Update existing tokens
    await googleOAuthTokensDb.updateByUserId(userId, {
      access_token_encrypted: accessTokenEncrypted,
      refresh_token_encrypted: refreshTokenEncrypted,
      token_expires_at: expiresAt.toISOString(),
      scope: CALENDAR_SCOPE,
    });
  } else {
    // Create new token record
    await googleOAuthTokensDb.create({
      user_id: userId,
      access_token_encrypted: accessTokenEncrypted,
      refresh_token_encrypted: refreshTokenEncrypted,
      token_expires_at: expiresAt.toISOString(),
      scope: CALENDAR_SCOPE,
      metadata: {},
    });
  }

  console.log(`[OAuth] Successfully stored tokens for user: ${userId}`);

  return userId;
}

/**
 * Get valid access token for user
 * Automatically refreshes token if expired
 *
 * @param userId - User ID
 * @returns Valid access token (decrypted)
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokenRecord = await googleOAuthTokensDb.getByUserId(userId);

  if (!tokenRecord) {
    throw new Error('User has not connected Google Calendar. Please authorize first.');
  }

  // Check if token is expired (with 5-minute buffer)
  const expiresAt = new Date(tokenRecord.token_expires_at);
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;
  const isExpired = expiresAt.getTime() - now.getTime() < fiveMinutes;

  if (isExpired) {
    console.log(`[OAuth] Access token expired for user ${userId}, refreshing...`);
    await refreshAccessToken(userId);
    // Fetch updated token
    const updatedToken = await googleOAuthTokensDb.getByUserId(userId);
    if (!updatedToken) {
      throw new Error('Failed to refresh token');
    }
    return decrypt(updatedToken.access_token_encrypted);
  }

  return decrypt(tokenRecord.access_token_encrypted);
}

/**
 * Refresh access token using refresh token
 *
 * @param userId - User ID
 */
export async function refreshAccessToken(userId: string): Promise<void> {
  const tokenRecord = await googleOAuthTokensDb.getByUserId(userId);

  if (!tokenRecord) {
    throw new Error('No tokens found for user');
  }

  const oauth2Client = getOAuth2Client();

  // Set refresh token
  const refreshToken = decrypt(tokenRecord.refresh_token_encrypted);
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    // Refresh token
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    // Encrypt new access token
    const accessTokenEncrypted = encrypt(credentials.access_token);

    // Calculate new expiry time
    const expiresAt = new Date(Date.now() + (credentials.expiry_date || 3600 * 1000));

    // Update database
    await googleOAuthTokensDb.updateByUserId(userId, {
      access_token_encrypted: accessTokenEncrypted,
      token_expires_at: expiresAt.toISOString(),
    });

    console.log(`[OAuth] Successfully refreshed token for user: ${userId}`);
  } catch (error) {
    console.error(`[OAuth] Failed to refresh token for user ${userId}:`, error);

    // If refresh fails, the refresh token might be expired or revoked
    // User needs to re-authorize
    throw new Error(
      'Failed to refresh access token. Your Google Calendar connection may have expired. Please reconnect.'
    );
  }
}

/**
 * Revoke access and delete tokens
 *
 * @param userId - User ID
 */
export async function revokeAccess(userId: string): Promise<void> {
  const tokenRecord = await googleOAuthTokensDb.getByUserId(userId);

  if (!tokenRecord) {
    // Already disconnected
    return;
  }

  const oauth2Client = getOAuth2Client();

  try {
    // Decrypt and revoke access token
    const accessToken = decrypt(tokenRecord.access_token_encrypted);
    oauth2Client.setCredentials({ access_token: accessToken });
    await oauth2Client.revokeCredentials();

    console.log(`[OAuth] Successfully revoked token for user: ${userId}`);
  } catch (error) {
    console.error(`[OAuth] Failed to revoke token (will delete anyway):`, error);
    // Continue to delete even if revoke fails
  }

  // Delete tokens from database
  await googleOAuthTokensDb.deleteByUserId(userId);

  console.log(`[OAuth] Deleted tokens for user: ${userId}`);
}

/**
 * Check if user has connected Google Calendar
 *
 * @param userId - User ID
 * @returns True if user has valid tokens
 */
export async function isConnected(userId: string): Promise<boolean> {
  const tokenRecord = await googleOAuthTokensDb.getByUserId(userId);
  return !!tokenRecord;
}

/**
 * Get OAuth2 client configured with user's access token
 * For internal use by calendar service
 *
 * @param userId - User ID
 * @returns Configured OAuth2 client
 */
export async function getAuthenticatedClient(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}
