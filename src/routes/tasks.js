//Criar tarefas no Google Tasks (regular/premium)
import { listTaskLists, createTask as createGoogleTask, createTaskList } from '../services/googleTasks.js';
import { refreshAccessToken } from '../services/googleOAuth.js';

export default {

  getTaskLists: async (req, res) => {
    try {
      const tokens = req.session?.user?.tokens;
      if (!tokens) return res.status(401).json({ error: 'No tokens' });

      const lists = await listTaskLists(tokens);
      res.json(lists);
    } catch (err) {
      console.error('getTaskLists error', err);
      res.status(500).json({ error: 'Failed to fetch task lists' });
    }
  },

  createTask: async (req, res) => {
    try {
      const tokens = req.session?.user?.tokens;
      const { listId, title, notes, due } = req.body;
      if (!tokens) return res.status(401).json({ error: 'No tokens' });
      if (!title) return res.status(400).json({ error: 'Missing title' });

      const defaultListName = process.env.DEFAULT_TASK_LIST || 'GitTasks';
      const requestedListName = listId || null;

      // Check permission tasklist:create using Casbin enforcer
      const enforcer = req.app.locals.enforcer;
      const userEmail = req.session?.user?.email;
      
      // If user specified a custom name different from the default
      const isCustomList = requestedListName && requestedListName !== defaultListName;
      
      if (isCustomList) {
        // Check if has permission tasklist:create
        const canCreateList = await enforcer.enforce(userEmail, 'tasklist', 'create');
        if (!canCreateList) {
          console.warn(`[DENY] ${userEmail} -> tasklist:create (only premium can use custom list names)`);
          return res.status(403).json({ 
            error: 'Only premium users can specify custom task list names',
            hint: 'Leave the field empty to use the default list'
          });
        }
        console.log(`[ALLOW] ${userEmail} -> tasklist:create`);
      }

      let resolvedListId = null;
      if (!requestedListName) {
        resolvedListId = '@default';
      } else {
        const lists = await listTaskLists(tokens);
        const found = lists.find(l => l.title === requestedListName || l.id === requestedListName);
        if (found) {
          resolvedListId = found.id;
        } else {
          if (requestedListName === defaultListName) {
            resolvedListId = '@default';
          } else {
            // If is custom and does not exist, create (we already checked permission above)
            if (isCustomList) {
              try {
                const newList = await createTaskList(tokens, requestedListName);
                resolvedListId = newList.id;
                console.log(`[Tasks] Created new task list for user: ${requestedListName} -> ${resolvedListId}`);
              } catch (errCreate) {
                console.error('Failed to create custom task list:', errCreate);
                return res.status(500).json({ 
                  error: 'Failed to create custom task list', 
                  details: String(errCreate.message || errCreate) 
                });
              }
            } else {
              return res.status(400).json({ error: 'Task list not found. Call GET /api/task-lists to see available lists.' });
            }
          }
        }
      }

      // Try create task (first attempt)
      try {
        const task = await createGoogleTask(tokens, resolvedListId, { title, notes, due });
        return res.status(201).json(task);
      } catch (err) {
        console.error('createTask first attempt error:', err && err.message ? err.message : err);

        // If we have a refresh token, attempt refresh + retry
        const refreshToken = req.session?.user?.tokens?.refresh_token;
        if (refreshToken) {
          try {
            const newTokens = await refreshAccessToken(refreshToken);
            req.session.user.tokens = {
              ...req.session.user.tokens,
              ...newTokens,
              refresh_token: req.session.user.tokens.refresh_token || newTokens.refresh_token
            };
            console.log('[Tasks] Retrying create after token refresh');
            const task = await createGoogleTask(req.session.user.tokens, resolvedListId, { title, notes, due });
            return res.status(201).json(task);
          } catch (err2) {
            console.error('createTask retry after refresh error:', err2 && err2.message ? err2.message : err2);
            return res.status(500).json({ 
              error: 'Failed to create task after token refresh', 
              details: String(err2.message || err2) 
            });
          }
        }

        return res.status(500).json({ error: 'Failed to create task', details: String(err.message || err) });
      }
    } catch (err) {
      console.error('createTask outer error', err);
      res.status(500).json({ error: 'Failed to create task', details: String(err.message || err) });
    }
  },
};