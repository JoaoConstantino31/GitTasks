//Listar milestones (free/regular/premium)
import { getUserRepositories, getRepositoryMilestones } from '../services/githubApi.js';

export default {
  /**
   * GET /api/repos
   * Responds with user's repositories (public + private if token available)
   */
  getUserRepositories: async (req, res) => {
    try {
      // Corrects to read the token from the right place
      const githubToken = req.session?.user?.githubToken || null;
      const repos = await getUserRepositories(githubToken);

      if (!repos || repos.length === 0) {
        return res.json({ count: 0, repositories: [], message: 'No repositories found. To see private repos, link your GitHub account.' });
      }

      // Actualize the session role  
      const enforcer = req.app.locals.enforcer;
      if (enforcer && req.session?.user?.email) {
        const roles = await enforcer.getRolesForUser(req.session.user.email);
        if (roles && roles.length > 0) req.session.role = roles[0];
      }

      res.json({ count: repos.length, repositories: repos });
    } catch (err) {
      console.error('getUserRepositories (route) error:', err);
      res.status(500).json({ error: 'Failed to fetch repositories' });
    }
  },

  /**
   * GET /api/milestones/:owner/:repo
   * Responds with milestones for given repo
   */
  getRepositoryMilestones: async (req, res) => {
    try {
      const { owner, repo } = req.params;
      const { state = 'open' } = req.query;
      if (!owner || !repo) return res.status(400).json({ error: 'Missing owner or repo' });

      // Corrects to read the token from the right place
      const githubToken = req.session?.user?.githubToken || null;
      const milestones = await getRepositoryMilestones(owner, repo, { state, token: githubToken });

      // Actualize the session role  
      const enforcer = req.app.locals.enforcer;
      if (enforcer && req.session?.user?.email) {
        const roles = await enforcer.getRolesForUser(req.session.user.email);
        if (roles && roles.length > 0) req.session.role = roles[0];
      }

      res.json({ owner, repo, state, count: milestones.length, milestones });
    } catch (err) {
      console.error('getRepositoryMilestones (route) error:', err);
      res.status(500).json({ error: 'Failed to fetch milestones' });
    }
  }
};