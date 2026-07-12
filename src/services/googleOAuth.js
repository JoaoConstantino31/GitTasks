//Troca de código por tokens, userinfo
import querystring from 'querystring';
import fetch from 'node-fetch';

/**
 * Exchange authorization code for access/refresh tokens
 * @param {string} code - Authorization code from Google
 * @returns {Promise<Object>} Tokens object: { access_token, refresh_token, expires_in, token_type }
 */
export async function exchangeCodeForTokens(code) {
  try {
    const params = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    };

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: querystring.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    const tokens = await response.json();
    //console.log('[OAuth] Token exchange successful');
    return tokens;
  } catch (err) {
    console.error('exchangeCodeForTokens error:', err);
    throw err;
  }
}

/**
 * Fetch user info from Google OpenID Connect userinfo endpoint
 * @param {string} accessToken - Google access token
 * @returns {Promise<Object>} User info: { sub, email, name, picture }
 */
export async function getUserInfo(accessToken) {
  try {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`UserInfo fetch failed: ${response.status} ${response.statusText}`);
    }

    const userInfo = await response.json();
    //console.log(`[OAuth] UserInfo retrieved for ${userInfo.email}`);

    return {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    };
  } catch (err) {
    console.error('getUserInfo error:', err);
    throw err;
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Google refresh token
 * @returns {Promise<Object>} New tokens object
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const params = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    };

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: querystring.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }

    const tokens = await response.json();
    console.log('[OAuth] Token refresh successful');
    return tokens;
  } catch (err) {
    console.error('refreshAccessToken error:', err);
    throw err;
  }
}