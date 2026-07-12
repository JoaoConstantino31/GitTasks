//Login Google OIDC, callback, logout
import querystring from 'querystring';
import { exchangeCodeForTokens, getUserInfo } from '../services/googleOAuth.js';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/tasks'
];

function buildAuthUrl() {
  const redirect = process.env.GOOGLE_REDIRECT_URI;
  if (!redirect) {
    console.error('Missing env GOOGLE_REDIRECT_URI — set it in .env or config/example.env');
  }

  const params = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirect || 'http://localhost:8080/auth/callback',
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent'
  };

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${querystring.stringify(params)}`;
  //console.log('[Auth] Authorization URL:', url); // debug log
  return url;
}

function buildGitHubAuthUrl() {
  const params = {
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:8081/auth/github/callback',
    scope: 'repo,user',
    allow_signup: true
  };
  return `https://github.com/login/oauth/authorize?${querystring.stringify(params)}`;
}

async function exchangeGitHubCode(code) {
  try {
    const params = {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:8081/auth/github/callback'
    };

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`GitHub token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`GitHub error: ${data.error_description}`);
    }

    console.log('[OAuth] GitHub token exchange successful');
    return data.access_token;
  } catch (err) {
    console.error('exchangeGitHubCode error:', err);
    throw err;
  }
}


export default {
  // Redirects user to Google authorization endpoint
  getLogin: (req, res) => {
    const url = buildAuthUrl();
    res.redirect(url);
  },

  getGitHubLogin: (req, res) => {
    const url = buildGitHubAuthUrl();
    res.redirect(url);
  },

  getAuthCallback: async (req, res) => {
     try {
      const { code, error } = req.query;
      if (error) return res.status(400).send(`Auth error: ${error}`);
      if (!code) return res.status(400).send('Missing code');

      const tokens = await exchangeCodeForTokens(code);
      const userInfo = await getUserInfo(tokens.access_token);

      // store minimal user in session
      req.session.user = {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        tokens
      };
      
      if (req.login) req.login(req.session.user, () => {});
      
      // Check if GitHub token already exists
      if (!req.session.user.githubToken) {
        // Redirect to GitHub login
        //console.log('[Auth] Redirecting to GitHub login...');
        return res.redirect('/auth/github/login');
      }
      
      res.redirect('/');
    } catch (err) {
      console.error('Auth callback error', err);
      res.status(500).send('Authentication failed');
    }
  },

  getGitHubCallback: async (req, res) => {
    try {
      const { code, error } = req.query;
      if (error) return res.status(400).send(`GitHub auth error: ${error}`);
      if (!code) return res.status(400).send('Missing code');

      const githubToken = await exchangeGitHubCode(code);
      
      // Store GitHub token in session
      if (req.session.user) {
        req.session.user.githubToken = githubToken;
        //console.log(`[OAuth] GitHub token stored for ${req.session.user.email}`);
      }

      res.redirect('/');
    } catch (err) {
      console.error('GitHub callback error', err);
      res.status(500).send('GitHub authentication failed');
    }
  },
   // Logout: destroy session
  postLogout: (req, res) => {
    req.session.destroy(err => {
      if (err) console.error('session destroy error', err);
      res.clearCookie('connect.sid');
      res.json({ ok: true });
    });
  },

  // POST /login - simple redirect to GET /login for OIDC flow
  postLogin: (req, res) => {
    res.redirect('/login');
  }
};