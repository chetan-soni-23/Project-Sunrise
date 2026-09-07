const pool = require('../config/database');

// Get travel policies
const getPolicies = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM travel_policies ORDER BY id'
    );

    res.json({
      success: true,
      policies: result.rows
    });
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get policy for specific designation
const getPolicyByDesignation = async (req, res) => {
  try {
    const { designation } = req.params;

    const result = await pool.query(
      'SELECT * FROM travel_policies WHERE designation = $1',
      [designation]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found for this designation' });
    }

    res.json({
      success: true,
      policy: result.rows[0]
    });
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Validate booking against policy
const validateBooking = async (req, res) => {
  try {
    const { userId, bookingType, flightClass, hotelStars, totalCost } = req.body;

    // Get user's designation
    const userResult = await pool.query(
      'SELECT designation FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDesignation = userResult.rows[0].designation;

    // Get policy for user's designation
    const policyResult = await pool.query(
      'SELECT * FROM travel_policies WHERE designation = $1',
      [userDesignation]
    );

    if (policyResult.rows.length === 0) {
      return res.status(404).json({ error: 'No policy found for user designation' });
    }

    const policy = policyResult.rows[0];
    const violations = [];

    // Check flight class
    if (bookingType === 'flight' && flightClass) {
      const allowedClasses = {
        'economy': ['economy'],
        'premium_economy': ['economy', 'premium_economy'],
        'business': ['economy', 'premium_economy', 'business'],
        'first': ['economy', 'premium_economy', 'business', 'first']
      };

      const allowed = allowedClasses[policy.max_flight_class] || ['economy'];
      if (!allowed.includes(flightClass.toLowerCase())) {
        violations.push(`Flight class '${flightClass}' not allowed. Maximum allowed: ${policy.max_flight_class}`);
      }
    }

    // Check hotel stars
    if (bookingType === 'hotel' && hotelStars) {
      if (hotelStars > policy.max_hotel_stars) {
        violations.push(`Hotel with ${hotelStars} stars exceeds maximum allowed ${policy.max_hotel_stars} stars`);
      }
    }

    // Check cost limits
    if (totalCost) {
      if (bookingType === 'flight' && policy.max_flight_cost) {
        if (parseFloat(totalCost) > parseFloat(policy.max_flight_cost)) {
          violations.push(`Flight cost ₹${totalCost} exceeds maximum allowed ₹${policy.max_flight_cost}`);
        }
      }
      if (bookingType === 'hotel' && policy.max_hotel_cost_per_night) {
        if (parseFloat(totalCost) > parseFloat(policy.max_hotel_cost_per_night)) {
          violations.push(`Hotel cost ₹${totalCost}/night exceeds maximum allowed ₹${policy.max_hotel_cost_per_night}`);
        }
      }
    }

    const isCompliant = violations.length === 0;

    res.json({
      success: true,
      compliant: isCompliant,
      violations,
      policy: {
        designation: policy.designation,
        max_flight_class: policy.max_flight_class,
        max_hotel_stars: policy.max_hotel_stars,
        salary_min_lakhs: policy.salary_min_lakhs,
        salary_max_lakhs: policy.salary_max_lakhs,
        max_hotel_cost_per_night: policy.max_hotel_cost_per_night,
        max_flight_cost: policy.max_flight_cost,
        requires_approval: policy.requires_approval
      }
    });
  } catch (error) {
    console.error('Validate booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create/Update policy (admin only)
const upsertPolicy = async (req, res) => {
  try {
    const { designation, maxFlightClass, maxHotelStars, salaryMinLakhs, salaryMaxLakhs, maxHotelCostPerNight, maxFlightCost, requiresApproval } = req.body;

    const result = await pool.query(
      `INSERT INTO travel_policies (designation, max_flight_class, max_hotel_stars, salary_min_lakhs, salary_max_lakhs, max_hotel_cost_per_night, max_flight_cost, requires_approval)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (designation) 
       DO UPDATE SET 
         max_flight_class = EXCLUDED.max_flight_class,
         max_hotel_stars = EXCLUDED.max_hotel_stars,
         salary_min_lakhs = EXCLUDED.salary_min_lakhs,
         salary_max_lakhs = EXCLUDED.salary_max_lakhs,
         max_hotel_cost_per_night = EXCLUDED.max_hotel_cost_per_night,
         max_flight_cost = EXCLUDED.max_flight_cost,
         requires_approval = EXCLUDED.requires_approval,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [designation, maxFlightClass, maxHotelStars, salaryMinLakhs || null, salaryMaxLakhs || null, maxHotelCostPerNight || null, maxFlightCost || null, requiresApproval]
    );

    res.json({
      success: true,
      policy: result.rows[0]
    });
  } catch (error) {
    console.error('Upsert policy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a policy
const deletePolicy = async (req, res) => {
  try {
    const { designation } = req.params;

    const result = await pool.query(
      'DELETE FROM travel_policies WHERE designation = $1 RETURNING *',
      [designation]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json({
      success: true,
      message: `Policy for '${designation}' deleted successfully`
    });
  } catch (error) {
    console.error('Delete policy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getPolicies, getPolicyByDesignation, validateBooking, upsertPolicy, deletePolicy };
