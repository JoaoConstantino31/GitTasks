//Middleware que valida sessão e cookie
//Middleware para garantir que o utilizador está autenticado
export function ensureAuth(req, res, next) {
  const user = req.session?.user || req.user;
  
  if (!user || !user.email) {
    return res.redirect('/login'); //redirects to /login
  }

  // User is authenticated, continue
  next();
}

//Middleware to ensure authentication and return useful JSON for API endpoints
export function ensureAuthJson(req, res, next) {
  const user = req.session?.user || req.user;
  
  if (!user || !user.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // User is authenticated, continue
  next();
}

//Helper to get the user from the session
export function getSessionUser(req) {
  return req.session?.user || req.user || null;
}

//Helper to get the user email
export function getUserEmail(req) {
  const user = getSessionUser(req);
  return user?.email || null;
}