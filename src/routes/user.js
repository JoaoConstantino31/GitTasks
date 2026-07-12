//Endpoint /me para informação do utilizador
export default {
   getUserInfo: async (req, res) => {
    const user = req.session?.user || req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    let role = 'free';
    const enforcer = req.app.locals.enforcer;
    if (enforcer && user.email) {
      try {
        // Always obtain the current role from Casbin
        const roles = await enforcer.getRolesForUser(user.email);
        if (roles && roles.length > 0) {
          role = roles[0];
          // Always update the session with the current role
          req.session.role = role;
        } else {
          role = 'free';
          req.session.role = 'free';
        }
      } catch (err) {
        console.error('Failed to resolve role from enforcer:', err);
        role = 'free';
        req.session.role = 'free';
      }
    } else {
      role = 'free';
      req.session.role = 'free';
    }

    res.json({
      email: user.email,
      name: user.name,
      picture: user.picture,
      role
    });
  }
};