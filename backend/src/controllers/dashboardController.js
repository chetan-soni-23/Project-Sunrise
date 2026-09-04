const pool = require('../config/database');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get today's bookings
    const todayBookings = await pool.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE DATE(created_at) = CURRENT_DATE`
    );

    // Get cancelled bookings
    const cancelledBookings = await pool.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE status = 'cancelled'`
    );

    // Get total travel spend
    const totalSpend = await pool.query(
      `SELECT COALESCE(SUM(total_cost), 0) as total FROM bookings 
       WHERE status IN ('approved', 'ticketed')`
    );

    // Get most travelled cities
    const topCities = await pool.query(
      `SELECT to_city, COUNT(*) as count 
       FROM bookings 
       WHERE booking_type = 'flight' AND status != 'cancelled' AND to_city IS NOT NULL
       GROUP BY to_city 
       ORDER BY count DESC 
       LIMIT 5`
    );

    // Get pending approvals count
    const pendingApprovals = await pool.query(
      `SELECT COUNT(*) as count FROM approvals 
       WHERE status = 'pending'`
    );

    // Get bookings by status
    const bookingsByStatus = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM bookings 
       GROUP BY status`
    );

    // Get recent bookings
    const recentBookings = await pool.query(
      `SELECT b.*, u.name as employee_name 
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC 
       LIMIT 10`
    );

    // Get today's spending
    const todaySpend = await pool.query(
      `SELECT COALESCE(SUM(total_cost), 0) as total FROM bookings 
       WHERE DATE(created_at) = CURRENT_DATE AND status IN ('approved', 'ticketed')`
    );

    // Get monthly spending trend
    const monthlyTrend = await pool.query(
      `SELECT 
         TO_CHAR(created_at, 'YYYY-MM') as month,
         COUNT(*) as bookings,
         COALESCE(SUM(total_cost), 0) as spend
       FROM bookings
       WHERE created_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ORDER BY month DESC`
    );

    res.json({
      success: true,
      stats: {
        today_bookings: parseInt(todayBookings.rows[0].count),
        cancelled_bookings: parseInt(cancelledBookings.rows[0].count),
        total_spend: parseFloat(totalSpend.rows[0].total),
        today_spend: parseFloat(todaySpend.rows[0].total),
        pending_approvals: parseInt(pendingApprovals.rows[0].count),
        top_cities: topCities.rows,
        bookings_by_status: bookingsByStatus.rows,
        recent_bookings: recentBookings.rows,
        monthly_trend: monthlyTrend.rows
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // User's bookings count by status
    const userBookings = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM bookings 
       WHERE user_id = $1
       GROUP BY status`,
      [userId]
    );

    // User's total spend
    const userSpend = await pool.query(
      `SELECT COALESCE(SUM(total_cost), 0) as total 
       FROM bookings 
       WHERE user_id = $1 AND status IN ('approved', 'ticketed')`,
      [userId]
    );

    // User's recent bookings
    const recentBookings = await pool.query(
      `SELECT * FROM bookings 
       WHERE user_id = $1
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    const stats = {
      bookings_by_status: userBookings.rows,
      total_spend: parseFloat(userSpend.rows[0].total),
      recent_bookings: recentBookings.rows
    };

    // For approvers/admins, include pending approvals count (including delegated)
    if (req.user.role === 'approver' || req.user.role === 'admin') {
      const pendingApprovals = await pool.query(
        `SELECT COUNT(*) as count FROM approvals 
         WHERE approver_id = $1 AND status = 'pending'`,
        [userId]
      );
      stats.pending_approvals = parseInt(pendingApprovals.rows[0].count);
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getDashboardStats, getUserStats };
