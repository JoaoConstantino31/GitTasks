//Funções para consultar Casbin (enforce)

/**
 * Middleware factory: verify permission using Casbin enforcer
 * @param {string} object - resource (e.g., 'milestones', 'tasks')
 * @param {string} action - action (e.g., 'view', 'create', 'update', 'delete')
 * @returns {Function} middleware
 */
export function requirePermission(object, action) {
  return async (req, res, next) => {
    try {
      const user = req.session?.user || req.user;
      if (!user || !user.email) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const enforcer = req.app.locals.enforcer;
      if (!enforcer) {
        console.error('Casbin enforcer not initialized');
        return res.status(500).json({ error: 'Authorization service unavailable' });
      }

      // Obtain the user's role through Casbin (via g() rule)
      const subject = user.email;
      
      // Verify permission: g(subject, role) && role -> object:action
      const allowed = await enforcer.enforce(subject, object, action);

      if (!allowed) {
        // Log denial
        console.warn(`[DENY] ${subject} -> ${object}:${action}`);
        return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      }

      // Log approval
      console.log(`[ALLOW] ${subject} -> ${object}:${action}`);

      // Store the user's role in the session (for UI)
      const roles = await enforcer.getRolesForUser(subject);
      if (roles && roles.length > 0) {
        req.session.role = roles[0]; // first role (e.g., 'free', 'regular', 'premium')
        console.log(`[ROLE MAPPING] ${subject} -> ${roles[0]}`); // debug log
      }

      next();
    } catch (err) {
      console.error('Permission check error:', err);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
}

/**
 * Helper to check permission synchronously (outside middleware)
 * Returns a promise: true if allowed, false otherwise
 */
export async function checkPermission(enforcer, userEmail, object, action) {
  try {
    return await enforcer.enforce(userEmail, object, action);
  } catch (err) {
    console.error('Permission check error:', err);
    return false;
  }
}

/**
 * Helper to get all roles of the user
 */
export async function getUserRoles(enforcer, userEmail) {
  try {
    const roles = enforcer.getRolesForUser(userEmail);
    console.log(`User ${userEmail} has roles: ${roles}`);
    return await roles;
  } catch (err) {
    console.error('Get user roles error:', err);
    return [];
  }
}

/**
 * Helper to get the permissions of a role
 */
export async function getRolePermissions(enforcer, role) {
  try {
    return await enforcer.getPermissionsForUser(role);
  } catch (err) {
    console.error('Get role permissions error:', err);
    return [];
  }
}

/**
 * Helper to check if the user has a specific role
 */
export async function userHasRole(enforcer, userEmail, role) {
  try {
    const roles = await enforcer.getRolesForUser(userEmail);
    return roles.includes(role);
  } catch (err) {
    console.error('Check user role error:', err);
    return false;
  }
}