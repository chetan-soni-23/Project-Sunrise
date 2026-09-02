const pool = require('../config/database');

// Create a new delegation
const createDelegation = async (req, res) => {
  try {
    const originalApproverId = req.user.id;
    const { delegatedToId, startDate, endDate, reason } = req.body;

    // Validate that the delegated user exists and is an approver
    const delegatedUser = await pool.query(
      "SELECT id, name, role FROM users WHERE id = $1",
      [delegatedToId]
    );

    if (delegatedUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (delegatedUser.rows[0].role !== 'approver' && delegatedUser.rows[0].role !== 'admin') {
      return res.status(400).json({ error: 'Can only delegate to approvers or admins' });
    }

    // Cannot delegate to yourself
    if (originalApproverId === parseInt(delegatedToId)) {
      return res.status(400).json({ error: 'Cannot delegate to yourself' });
    }

    // Check for existing active delegation to the same person
    const existingDelegation = await pool.query(
      `SELECT id FROM approval_delegations 
       WHERE original_approver_id = $1 AND delegated_to_id = $2 AND is_active = true`,
      [originalApproverId, delegatedToId]
    );

    if (existingDelegation.rows.length > 0) {
      return res.status(400).json({ error: 'Active delegation to this user already exists' });
    }

    // Validate dates if provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    const result = await pool.query(
      `INSERT INTO approval_delegations (original_approver_id, delegated_to_id, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [originalApproverId, delegatedToId, startDate || null, endDate || null, reason || null]
    );

    res.status(201).json({
      success: true,
      message: 'Delegation created successfully',
      delegation: result.rows[0]
    });
  } catch (error) {
    console.error('Create delegation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all delegations for current user (as original approver)
const getMyDelegations = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT d.*, u.name as delegated_to_name, u.email as delegated_to_email,
              o.name as original_approver_name
       FROM approval_delegations d
       JOIN users u ON d.delegated_to_id = u.id
       JOIN users o ON d.original_approver_id = o.id
       WHERE d.original_approver_id = $1
       ORDER BY d.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      delegations: result.rows
    });
  } catch (error) {
    console.error('Get delegations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get delegations where I am the delegate
const getDelegatedToMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT d.*, o.name as original_approver_name, o.email as original_approver_email
       FROM approval_delegations d
       JOIN users o ON d.original_approver_id = o.id
       WHERE d.delegated_to_id = $1 AND d.is_active = true
       ORDER BY d.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      delegations: result.rows
    });
  } catch (error) {
    console.error('Get delegated to me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Revoke a delegation
const revokeDelegation = async (req, res) => {
  try {
    const { delegationId } = req.params;
    const userId = req.user.id;

    // Check if delegation exists and belongs to current user
    const delegation = await pool.query(
      'SELECT * FROM approval_delegations WHERE id = $1 AND original_approver_id = $2',
      [delegationId, userId]
    );

    if (delegation.rows.length === 0) {
      return res.status(404).json({ error: 'Delegation not found' });
    }

    await pool.query(
      'UPDATE approval_delegations SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [delegationId]
    );

    res.json({
      success: true,
      message: 'Delegation revoked successfully'
    });
  } catch (error) {
    console.error('Revoke delegation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a delegation
const updateDelegation = async (req, res) => {
  try {
    const { delegationId } = req.params;
    const userId = req.user.id;
    const { delegatedToId, startDate, endDate, reason } = req.body;

    // Check if delegation exists and belongs to current user
    const existing = await pool.query(
      'SELECT * FROM approval_delegations WHERE id = $1 AND original_approver_id = $2',
      [delegationId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Delegation not found' });
    }

    // If changing the delegate, validate the new user
    if (delegatedToId && delegatedToId !== existing.rows[0].delegated_to_id) {
      const delegatedUser = await pool.query(
        "SELECT id, name, role FROM users WHERE id = $1",
        [delegatedToId]
      );

      if (delegatedUser.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (delegatedUser.rows[0].role !== 'approver' && delegatedUser.rows[0].role !== 'admin') {
        return res.status(400).json({ error: 'Can only delegate to approvers or admins' });
      }

      // Cannot delegate to yourself
      if (userId === parseInt(delegatedToId)) {
        return res.status(400).json({ error: 'Cannot delegate to yourself' });
      }

      // Check for existing active delegation to the new person
      const duplicateCheck = await pool.query(
        `SELECT id FROM approval_delegations 
         WHERE original_approver_id = $1 AND delegated_to_id = $2 AND is_active = true AND id != $3`,
        [userId, delegatedToId, delegationId]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Active delegation to this user already exists' });
      }
    }

    // Validate dates if provided
    const newStartDate = startDate !== undefined ? startDate : existing.rows[0].start_date;
    const newEndDate = endDate !== undefined ? endDate : existing.rows[0].end_date;
    if (newStartDate && newEndDate && new Date(newStartDate) > new Date(newEndDate)) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    const result = await pool.query(
      `UPDATE approval_delegations 
       SET delegated_to_id = COALESCE($1, delegated_to_id),
           start_date = $2,
           end_date = $3,
           reason = COALESCE($4, reason),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        delegatedToId || null,
        startDate !== undefined ? (startDate || null) : existing.rows[0].start_date,
        endDate !== undefined ? (endDate || null) : existing.rows[0].end_date,
        reason !== undefined ? (reason || null) : existing.rows[0].reason,
        delegationId
      ]
    );

    res.json({
      success: true,
      message: 'Delegation updated successfully',
      delegation: result.rows[0]
    });
  } catch (error) {
    console.error('Update delegation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a delegation permanently
const deleteDelegation = async (req, res) => {
  try {
    const { delegationId } = req.params;
    const userId = req.user.id;

    // Check if delegation exists and belongs to current user
    const delegation = await pool.query(
      'SELECT * FROM approval_delegations WHERE id = $1 AND original_approver_id = $2',
      [delegationId, userId]
    );

    if (delegation.rows.length === 0) {
      return res.status(404).json({ error: 'Delegation not found' });
    }

    await pool.query('DELETE FROM approval_delegations WHERE id = $1', [delegationId]);

    res.json({
      success: true,
      message: 'Delegation deleted permanently'
    });
  } catch (error) {
    console.error('Delete delegation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if a delegation is active for a given approver
const checkActiveDelegation = async (req, res) => {
  try {
    const { approverId } = req.params;

    const result = await pool.query(
      `SELECT d.*, u.name as delegated_to_name, u.email as delegated_to_email
       FROM approval_delegations d
       JOIN users u ON d.delegated_to_id = u.id
       WHERE d.original_approver_id = $1 
         AND d.is_active = true
         AND (d.start_date IS NULL OR d.start_date <= CURRENT_DATE)
         AND (d.end_date IS NULL OR d.end_date >= CURRENT_DATE)`,
      [approverId]
    );

    res.json({
      success: true,
      hasDelegation: result.rows.length > 0,
      delegation: result.rows[0] || null
    });
  } catch (error) {
    console.error('Check delegation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all approvers (for delegation dropdown)
const getApprovers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, designation FROM users WHERE role IN ('approver', 'admin') ORDER BY name"
    );

    res.json({
      success: true,
      approvers: result.rows
    });
  } catch (error) {
    console.error('Get approvers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createDelegation,
  getMyDelegations,
  getDelegatedToMe,
  updateDelegation,
  deleteDelegation,
  revokeDelegation,
  checkActiveDelegation,
  getApprovers
};
