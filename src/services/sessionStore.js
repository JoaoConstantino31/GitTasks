//Sessões em memória conforme requisitos
// Não usa base de dados, apenas memória

class InMemorySessionStore {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session object or null
   */
  get(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Store session
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - Session data
   */
  set(sessionId, sessionData) {
    this.sessions.set(sessionId, {
      ...sessionData,
      createdAt: new Date(),
      lastAccess: new Date()
    });
    console.log(`[Session] Stored session: ${sessionId}`);
  }

  /**
   * Update session
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Fields to update
   */
  update(sessionId, updates) {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      this.sessions.set(sessionId, {
        ...existing,
        ...updates,
        lastAccess: new Date()
      });
      console.log(`[Session] Updated session: ${sessionId}`);
    }
  }

  /**
   * Delete session
   * @param {string} sessionId - Session ID
   */
  delete(sessionId) {
    this.sessions.delete(sessionId);
    console.log(`[Session] Deleted session: ${sessionId}`);
  }

  /**
   * Check if session exists
   * @param {string} sessionId - Session ID
   * @returns {boolean}
   */
  has(sessionId) {
    return this.sessions.has(sessionId);
  }

  /**
   * Get all sessions (for debugging/monitoring)
   * @returns {Array} Array of sessions
   */
  getAll() {
    return Array.from(this.sessions.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  /**
   * Clear all sessions
   */
  clear() {
    const count = this.sessions.size;
    this.sessions.clear();
    console.log(`[Session] Cleared ${count} sessions`);
  }

  /**
   * Cleanup expired sessions (opcional)
   * Remove sessions older than 24 hours
   */
  cleanupExpired(maxAge = 24 * 60 * 60 * 1000) {
    const now = new Date();
    let deleted = 0;

    for (const [sessionId, data] of this.sessions.entries()) {
      if (now - data.createdAt > maxAge) {
        this.sessions.delete(sessionId);
        deleted++;
      }
    }

    if (deleted > 0) {
      console.log(`[Session] Cleaned up ${deleted} expired sessions`);
    }
  }

  /**
   * Get session statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      sessions: this.getAll()
    };
  }
}

// Export singleton instance
export const sessionStore = new InMemorySessionStore();

// Setup periodic cleanup 
setInterval(() => {
  sessionStore.cleanupExpired();
}, 60 * 60 * 1000);