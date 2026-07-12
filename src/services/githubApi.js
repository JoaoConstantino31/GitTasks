//Pedidos HTTP ao GitHub API para milestones
import fetch from 'node-fetch';
/**
 * Fetch user repositories from GitHub API
 * @param {string|null} token - GitHub personal access token (optional, for private repos)
 * @returns {Promise<Array>} Array of repositories
 */
export async function getUserRepositories(token = null) {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token) headers['Authorization'] = `token ${token}`;

    const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      method: 'GET',
      headers
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API error: ${res.status} ${res.statusText} - ${body}`);
    }

    const repos = await res.json();
    return repos.map(r => ({
      id: r.id,
      name: r.name,
      owner: r.owner?.login,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      private: r.private,
      language: r.language,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      updated_at: r.updated_at
    }));
  } catch (err) {
    console.error('getUserRepositories error:', err);
    throw err;
  }
}

/**
 * Fetch milestones for a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} options - { state: 'open'|'closed'|'all', token?: string }
 * @returns {Promise<Array>} Array of milestones
 */
export async function getRepositoryMilestones(owner, repo, options = {}) {
  try {
    const { state = 'open', token = null } = options;
    if (!owner || !repo) throw new Error('owner and repo required');

    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `token ${token}`;

    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/milestones?state=${encodeURIComponent(state)}&per_page=100`;

    const res = await fetch(url, { method: 'GET', headers });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API error: ${res.status} ${res.statusText} - ${body}`);
    }

    const milestones = await res.json();
    return milestones.map(m => ({
      id: m.number,
      title: m.title,
      description: m.description,
      state: m.state,
      open_issues: m.open_issues,
      closed_issues: m.closed_issues,
      due_date: m.due_on,
      created_at: m.created_at,
      updated_at: m.updated_at,
      url: m.html_url
    }));
  } catch (err) {
    console.error('getRepositoryMilestones error:', err);
    throw err;
  }
}