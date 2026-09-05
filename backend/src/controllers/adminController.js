const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// Get all users
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.designation, u.salary_band, u.department, 
              u.manager_id, u.created_at, u.updated_at,
              m.name as manager_name
       FROM users u
       LEFT JOIN users m ON u.manager_id = m.id
       ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single user
const getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.designation, u.salary_band, u.department,
              u.manager_id, u.created_at, u.updated_at,
              m.name as manager_name
       FROM users u
       LEFT JOIN users m ON u.manager_id = m.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, designation, salaryBand, department, managerId } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role || !designation || !salaryBand) {
      return res.status(400).json({ error: 'Name, email, password, role, designation, and salary band are required' });
    }

    // Check for existing email
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Validate manager exists if provided
    if (managerId) {
      const managerExists = await pool.query('SELECT id FROM users WHERE id = $1', [managerId]);
      if (managerExists.rows.length === 0) {
        return res.status(400).json({ error: 'Manager not found' });
      }
      // Prevent self-assignment as manager
      // (can't check since user doesn't exist yet, but we can validate after insert)
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, designation, salary_band, department, manager_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, designation, salary_band, department, manager_id, created_at`,
      [name, email, passwordHash, role, designation, salaryBand, department || null, managerId || null]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a user
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, designation, salaryBand, department, managerId } = req.body;

    // Check user exists
    const existing = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness if changing
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Prevent self-assignment as manager
    if (managerId && parseInt(managerId) === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot assign yourself as your own manager' });
    }

    // Validate manager exists if provided
    if (managerId) {
      const managerExists = await pool.query('SELECT id FROM users WHERE id = $1', [managerId]);
      if (managerExists.rows.length === 0) {
        return res.status(400).json({ error: 'Manager not found' });
      }
    }

    // Handle manager_id: use provided value, 'none'/empty means remove manager
    let effectiveManagerId;
    if (managerId !== undefined && managerId !== null) {
      effectiveManagerId = (managerId && managerId !== 'none') ? managerId : null;
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           designation = COALESCE($4, designation),
           salary_band = COALESCE($5, salary_band),
           department = COALESCE($6, department),
           manager_id = COALESCE($7, manager_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, name, email, role, designation, salary_band, department, manager_id, created_at, updated_at`,
      [name || null, email || null, role || null, designation || null, salaryBand || null, department || null, effectiveManagerId, userId]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset user password
const resetPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, userId]
    );

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const existing = await pool.query('SELECT id, name FROM users WHERE id = $1', [userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: `User '${existing.rows[0].name}' deleted successfully`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, resetPassword, deleteUser };
