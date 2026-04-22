/**
 * Utility to build dynamic SQL WHERE clauses for multi-token lead search.
 */

/**
 * Builds a dynamic WHERE clause for searching leads across multiple fields.
 * @param {string|number} userId - The ID of the user owning the leads.
 * @param {string[]} patterns - Array of SQL LIKE patterns (e.g., ["%token%"]).
 * @returns {Object|null} - { whereClause, values } or null if no patterns.
 */
export const buildLeadSearchQuery = (userId, patterns) => {
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
    return null;
  }

  const values = [userId, ...patterns];

  // Base ownership filter
  let whereClause = "created_by = $1";

  // Build the OR logic for each pattern across multiple fields
  const tokenConditions = patterns.map((_, index) => {
    const paramIndex = index + 2; // Offset by 1 for userId ($1)
    return `(
      name ILIKE $${paramIndex} OR 
      email ILIKE $${paramIndex} OR 
      company ILIKE $${paramIndex} OR 
      phone LIKE $${paramIndex}
    )`;
  });

  // Wrap all token conditions in an AND ( ... OR ... ) block
  whereClause += ` AND (${tokenConditions.join(" OR ")})`;

  return {
    whereClause,
    values,
  };
};
