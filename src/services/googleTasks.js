//Lists, criação de tasks via Google Tasks API
import fetch from 'node-fetch';

/**
 * List all task lists for authenticated user
 * @param {Object} tokens - { access_token, refresh_token, ... }
 * @returns {Promise<Array>} Array of task lists
 */
export async function listTaskLists(tokens) {
  try {
    const response = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch task lists: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error('listTaskLists error:', err);
    throw err;
  }
}

/**
 * Create a new task in a task list
 * @param {Object} tokens - { access_token, refresh_token, ... }
 * @param {string} listId - Task list ID
 * @param {Object} taskData - { title, notes, due }
 * @returns {Promise<Object>} Created task
 */
export async function createTask(tokens, listId, taskData) {
  try {
    // Normalize listId for default list
    const targetListId = (listId === 'default' || listId === undefined || listId === null) ? '@default' : listId;

    // Build request body avoiding null fields
    const bodyObj = {};
    if (taskData?.title) bodyObj.title = taskData.title;
    if (taskData?.notes) bodyObj.notes = taskData.notes;
    if (taskData?.due) {
      // Ensure due is an ISO/RFC3339 string
      const dt = new Date(taskData.due);
      if (!isNaN(dt)) bodyObj.due = dt.toISOString();
      else bodyObj.due = taskData.due; // fallback: send as-is
    }

    const response = await fetch(
      `https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(targetListId)}/tasks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyObj)
      }
    );

    if (!response.ok) {
      // Try to extract detailed error from response body
      let details = '';
      try {
        const json = await response.json();
        details = JSON.stringify(json);
      } catch (e) {
        details = await response.text().catch(() => '');
      }
      const msg = `Failed to create task: ${response.status} ${response.statusText} ${details}`;
      console.error('createTask response error:', msg);
      throw new Error(msg);
    }

    const task = await response.json();
    console.log(`[Tasks] Created task: ${task.title || task.id}`);
    return task;
  } catch (err) {
    console.error('createTask error:', err);
    throw err;
  }
}

//Create a task list with given title
export async function createTaskList(tokens, title) {
  try {
    if (!title) throw new Error('Title required to create task list');
    const response = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      let details = '';
      try { details = JSON.stringify(await response.json()); } catch (e) { details = await response.text().catch(() => ''); }
      throw new Error(`Failed to create task list: ${response.status} ${response.statusText} ${details}`);
    }

    const list = await response.json();
    console.log(`[Tasks] Created task list: ${list.title || list.id}`);
    return list;
  } catch (err) {
    console.error('createTaskList error:', err);
    throw err;
  }
}

/**
 * Get tasks from a specific task list
 * @param {Object} tokens - { access_token, refresh_token, ... }
 * @param {string} listId - Task list ID
 * @returns {Promise<Array>} Array of tasks
 */
export async function getTasksFromList(tokens, listId) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/tasks/v1/lists/${listId}/tasks`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error('getTasksFromList error:', err);
    throw err;
  }
}