/**
 * Utility for tokenizing search queries and generating SQL LIKE patterns.
 */

/**
 * Tokenizes a search string and prepares SQL-ready patterns.
 * @param {string} q - The search query string.
 * @returns {Object|null} - { tokens, patterns } or null if query is empty.
 */
export const tokenizeSearchQuery = (q) => {
  if (!q || !q.trim()) return null;

  // Normalize and split by one or more spaces
  const tokens = q.trim().toLowerCase().split(/\s+/);

  // Filter out any empty tokens (e.g. from trailing spaces if split was different)
  if (tokens.length === 0) return null;

  // Create SQL LIKE patterns (%token%)
  const patterns = tokens.map((t) => `%${t}%`);

  return {
    tokens,
    patterns,
  };
};
