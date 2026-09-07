const pool = require('../config/database');
const { generateConfirmationNumber, generateFlightTicket, generateHotelTicket } = require('../services/ticketService');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');

// Create new booking
const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      bookingType,
      travelDate,
      returnDate,
      fromCity,
      toCity,
      hotelName,
      hotelCity,
      checkIn,
      checkOut,
      flightClass,
      hotelStars,
      totalCost,
      notes,
      justification
    } = req.body;

    // Validate booking type
    if (!['flight', 'hotel'].includes(bookingType)) {
      return res.status(400).json({ error: 'Invalid booking type' });
    }

    // Get user's designation for policy check
    const userResult = await pool.query(
      'SELECT designation FROM users WHERE id = $1',
      [userId]
    );

    const userDesignation = userResult.rows[0]?.designation;

    // Get designation-based policy
    const policyResult = await pool.query(
      'SELECT * FROM travel_policies WHERE designation = $1',
      [userDesignation]
    );

    let policyViolations = [];
    let policyCompliant = true;

    if (policyResult.rows.length > 0) {
      const policy = policyResult.rows[0];

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
          policyViolations.push(`Flight class '${flightClass}' not allowed. Max: ${policy.max_flight_class}`);
          policyCompliant = false;
        }
      }

      // Check hotel stars
      if (bookingType === 'hotel' && hotelStars) {
        if (hotelStars > policy.max_hotel_stars) {
          policyViolations.push(`Hotel with ${hotelStars} stars exceeds max ${policy.max_hotel_stars} stars`);
          policyCompliant = false;
        }
      }

      // Check cost limits
      if (totalCost) {
        if (bookingType === 'flight' && policy.max_flight_cost) {
          if (parseFloat(totalCost) > parseFloat(policy.max_flight_cost)) {
            policyViolations.push(`Flight cost ₹${totalCost} exceeds maximum allowed ₹${policy.max_flight_cost}`);
            policyCompliant = false;
          }
        }
        if (bookingType === 'hotel' && policy.max_hotel_cost_per_night) {
          if (parseFloat(totalCost) > parseFloat(policy.max_hotel_cost_per_night)) {
            policyViolations.push(`Hotel cost ₹${totalCost}/night exceeds maximum allowed ₹${policy.max_hotel_cost_per_night}`);
            policyCompliant = false;
          }
        }
      }
    }

    // Determine if approval is needed and find approver BEFORE creating the booking
    const requiresApproval = policyResult.rows.length > 0 && policyResult.rows[0].requires_approval;
    let originalApproverId = null;

    if (requiresApproval) {
      // Find the appropriate approver using hierarchy:
      // 1. User's direct manager (if they have one and it's an approver)
      // 2. Walk up the management chain to find an approver
      // 3. Fall back to department head (approver in same department)
      // 4. Fall back to any approver (not self)
      // 5. Fall back to admin
      
      // Get user's info including manager_id and department
      const userInfoResult = await pool.query(
        'SELECT manager_id, department FROM users WHERE id = $1',
        [userId]
      );
      const userInfo = userInfoResult.rows[0];

      // Strategy 1: Walk up the management chain
      if (userInfo.manager_id) {
        let currentManagerId = userInfo.manager_id;
        const visitedManagers = new Set([userId]); // Prevent infinite loops
        
        while (currentManagerId && !visitedManagers.has(currentManagerId)) {
          visitedManagers.add(currentManagerId);
          
          const managerResult = await pool.query(
            'SELECT id, role, department FROM users WHERE id = $1',
            [currentManagerId]
          );
          
          if (managerResult.rows.length === 0) break;
          
          const manager = managerResult.rows[0];
          
          // If manager is an approver, use them (unless they are the booking creator)
          if (manager.role === 'approver' && manager.id !== userId) {
            originalApproverId = manager.id;
            break;
          }
          
          // Move up to the next manager
          const nextManagerResult = await pool.query(
            'SELECT manager_id FROM users WHERE id = $1',
            [currentManagerId]
          );
          const nextManagerRow = nextManagerResult.rows[0];
          currentManagerId = nextManagerRow?.manager_id;
        }
      }

      // Strategy 2: Fall back to department head (approver in same department)
      if (!originalApproverId && userInfo.department) {
        const deptHeadResult = await pool.query(
          `SELECT id FROM users 
           WHERE role = 'approver' 
             AND department = $1 
             AND id != $2
           ORDER BY 
             CASE designation
               WHEN 'VP' THEN 1
               WHEN 'Senior Manager' THEN 2
               WHEN 'Manager' THEN 3
               ELSE 4
             END
           LIMIT 1`,
          [userInfo.department, userId]
        );
        
        if (deptHeadResult.rows.length > 0) {
          originalApproverId = deptHeadResult.rows[0].id;
        }
      }

      // Strategy 3: Fall back to any approver (not the booking creator)
      if (!originalApproverId) {
        const fallbackResult = await pool.query(
          `SELECT id FROM users 
           WHERE role = 'approver' 
             AND id != $1
           LIMIT 1`,
          [userId]
        );
        
        if (fallbackResult.rows.length > 0) {
          originalApproverId = fallbackResult.rows[0].id;
        }
      }

      // Strategy 4: Fall back to admin if no approver found
      if (!originalApproverId) {
        const adminResult = await pool.query(
          `SELECT id FROM users 
           WHERE role = 'admin' 
             AND id != $1
           LIMIT 1`,
          [userId]
        );
        
        if (adminResult.rows.length > 0) {
          originalApproverId = adminResult.rows[0].id;
        }
      }
    }

    // If policy violations exist, require justification
    if (!policyCompliant && (!justification || justification.trim() === '')) {
      return res.status(400).json({
        error: 'Justification required for out-of-policy booking',
        policy_violations: policyViolations,
        requires_justification: true
      });
    }

    // Determine initial booking status:
    // - 'approved' if no approval required by policy
    // - 'approved' if approval required but no approver could be found (prevent zombie bookings)
    // - 'pending' if approval required and approver found
    const requiresApprovalFlow = requiresApproval && originalApproverId;
    const initialStatus = requiresApprovalFlow ? 'pending' : 'approved';

    if (requiresApproval && !originalApproverId) {
      console.warn(`Approval required but no approver found for user ${userId} — auto-approving booking`);
    }

    // Create booking + approval atomically
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create booking
      const result = await client.query(
        `INSERT INTO bookings (
          user_id, booking_type, status, travel_date, return_date,
          from_city, to_city, hotel_name, hotel_city, check_in, check_out,
          flight_class, hotel_stars, total_cost, policy_compliant, policy_violations, notes, justification
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING *`,
        [
          userId, bookingType, initialStatus, travelDate, returnDate,
          fromCity, toCity, hotelName, hotelCity, checkIn, checkOut,
          flightClass, hotelStars, totalCost, policyCompliant, policyViolations, notes, justification || null
        ]
      );

      const booking = result.rows[0];

      // Create approval request only if we have an approver and approval is required
      if (requiresApprovalFlow && originalApproverId) {
        let effectiveApproverId = originalApproverId;
        let delegatedFrom = null;

        // Check for active delegation
        const delegationResult = await client.query(
          `SELECT delegated_to_id FROM approval_delegations 
           WHERE original_approver_id = $1 
             AND is_active = true
             AND (start_date IS NULL OR start_date <= CURRENT_DATE)
             AND (end_date IS NULL OR end_date >= CURRENT_DATE)`,
          [originalApproverId]
        );

        if (delegationResult.rows.length > 0) {
          // Ensure delegate is not the booking creator
          const delegateId = delegationResult.rows[0].delegated_to_id;
          if (delegateId !== userId) {
            effectiveApproverId = delegateId;
            delegatedFrom = originalApproverId;
          }
        }

        await client.query(
          `INSERT INTO approvals (booking_id, approver_id, status, delegated_from)
           VALUES ($1, $2, 'pending', $3)`,
          [booking.id, effectiveApproverId, delegatedFrom]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: initialStatus === 'approved' 
          ? 'Booking created and auto-approved' 
          : 'Booking created successfully',
        booking,
        policy_compliant: policyCompliant,
        policy_violations: policyViolations,
        justification: justification || null
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    // Handle unique constraint violation (duplicate approval for same booking+approver)
    if (error.code === '23505') {
      return res.status(400).json({ error: 'An approval request for this booking already exists' });
    }
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's bookings
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT b.*, a.status as approval_status, a.comments as approval_comments, a.created_at as approval_date
       FROM bookings b
       LEFT JOIN approvals a ON b.id = a.booking_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all approvals for this approver (all statuses)
const getAllApprovals = async (req, res) => {
  try {
    const approverId = req.user.id;

    const result = await pool.query(
      `SELECT b.*, u.name as employee_name, u.designation as employee_designation,
              a.id as approval_id, a.status as approval_status, a.created_at as approval_date, a.comments as approval_comments,
              a.delegated_from,
              d.name as delegated_from_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN approvals a ON b.id = a.booking_id
       LEFT JOIN users d ON a.delegated_from = d.id
       WHERE a.approver_id = $1
       ORDER BY b.created_at DESC`,
      [approverId]
    );

    res.json({
      success: true,
      approvals: result.rows
    });
  } catch (error) {
    console.error('Get all approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pending approvals (for approvers)
const getPendingApprovals = async (req, res) => {
  try {
    const approverId = req.user.id;

    const result = await pool.query(
      `SELECT b.*, u.name as employee_name, u.designation as employee_designation,
              a.id as approval_id, a.status as approval_status, a.created_at as approval_date,
              a.delegated_from,
              d.name as delegated_from_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN approvals a ON b.id = a.booking_id
       LEFT JOIN users d ON a.delegated_from = d.id
       WHERE a.approver_id = $1 AND a.status = 'pending'
       ORDER BY b.created_at DESC`,
      [approverId]
    );

    res.json({
      success: true,
      approvals: result.rows
    });
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve/Reject booking
const updateApproval = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { status, comments } = req.body;
    const approverId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
    }

    // Check if approval exists and belongs to this approver
    const approvalResult = await pool.query(
      `SELECT a.*, b.id as booking_id
       FROM approvals a
       JOIN bookings b ON a.booking_id = b.id
       WHERE a.id = $1 AND a.approver_id = $2 AND a.status = 'pending'`,
      [approvalId, approverId]
    );

    if (approvalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Approval not found or already processed' });
    }

    const bookingId = approvalResult.rows[0].booking_id;

    // Update approval and booking status atomically
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update approval status
      await client.query(
        'UPDATE approvals SET status = $1, comments = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [status, comments, approvalId]
      );

      // Update booking status
      await client.query(
        'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, bookingId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // --- Post-approval fulfillment (runs after transaction commits) ---
    if (status === 'approved') {
      try {
        // Fetch full booking + user + policy data
        const bookingResult = await pool.query(
          `SELECT b.*, u.name, u.email, u.designation, u.department, u.id as user_id
           FROM bookings b
           JOIN users u ON b.user_id = u.id
           WHERE b.id = $1`,
          [bookingId]
        );
        const booking = bookingResult.rows[0];

        const policyResult = await pool.query(
          'SELECT * FROM travel_policies WHERE designation = $1',
          [booking.designation]
        );
        const policy = policyResult.rows[0] || {};

        const user = {
          id: booking.user_id,
          name: booking.name,
          email: booking.email,
          designation: booking.designation,
          department: booking.department,
        };

        // 1. Generate confirmation number
        const confirmationNumber = generateConfirmationNumber();

        // 2. Generate PDF ticket
        let ticketPath = null;
        let ticketFilename = null;
        if (booking.booking_type === 'flight') {
          const result = await generateFlightTicket(booking, user, policy);
          ticketPath = result.filepath;
          ticketFilename = result.filename;
        } else {
          const result = await generateHotelTicket(booking, user, policy);
          ticketPath = result.filepath;
          ticketFilename = result.filename;
        }

        // 3. Update booking with confirmation number and ticket path
        await pool.query(
          `UPDATE bookings SET
            confirmation_number = $1,
            ticket_pdf_path = $2,
            ticket_generated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [confirmationNumber, ticketPath, bookingId]
        );

        // 4. Send approval email with PDF attached
        await sendApprovalEmail(user, {
          ...booking,
          _ticketPath: ticketPath,
          _ticketFilename: ticketFilename,
        }, confirmationNumber);

        // 5. Mark email sent
        await pool.query(
          'UPDATE bookings SET email_sent_at = CURRENT_TIMESTAMP, status = $1 WHERE id = $2',
          ['ticketed', bookingId]
        );

        console.log(`Fulfillment complete for booking ${bookingId}: confirmation=${confirmationNumber}`);
      } catch (fulfillError) {
        console.error(`Fulfillment failed for booking ${bookingId}:`, fulfillError);
        // Fulfillment failure should not break the approval response
      }
    }

    // --- Post-rejection email (non-blocking) ---
    if (status === 'rejected') {
      try {
        const bookingResult = await pool.query(
          `SELECT b.*, u.name, u.email, u.designation, u.department
           FROM bookings b
           JOIN users u ON b.user_id = u.id
           WHERE b.id = $1`,
          [bookingId]
        );
        const booking = bookingResult.rows[0];

        await sendRejectionEmail(
          { name: booking.name, email: booking.email },
          booking,
          comments || 'No reason provided'
        );
      } catch (emailError) {
        console.error(`Rejection email failed for booking ${bookingId}:`, emailError);
      }
    }

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      booking_id: bookingId,
      status
    });
  } catch (error) {
    console.error('Update approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Check if booking belongs to user and can be cancelled
    const bookingResult = await pool.query(
      `SELECT * FROM bookings 
       WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'approved')`,
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or cannot be cancelled' });
    }

    // Cancel booking and approvals atomically
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update booking status
      await client.query(
        "UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [bookingId]
      );

      // Also cancel any pending approvals for this booking
      await client.query(
        "UPDATE approvals SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE booking_id = $1 AND status = 'pending'",
        [bookingId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Booking cancelled successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all bookings (admin only)
const getAllBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.name as employee_name, u.designation as employee_designation
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC`
    );

    res.json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Download e-ticket PDF
const downloadTicket = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT b.*, u.name as employee_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1 AND (b.user_id = $2 OR $3 IN ('admin'))`,
      [bookingId, userId, req.user.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];

    if (!booking.ticket_pdf_path) {
      return res.status(404).json({ error: 'E-ticket not yet generated. Please wait for approval.' });
    }

    const fs = require('fs');
    if (!fs.existsSync(booking.ticket_pdf_path)) {
      return res.status(404).json({ error: 'E-ticket file not found' });
    }

    const filename = booking.booking_type === 'flight'
      ? `e-ticket-${booking.confirmation_number || bookingId}.pdf`
      : `confirmation-${booking.confirmation_number || bookingId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(booking.ticket_pdf_path);
  } catch (error) {
    console.error('Download ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllApprovals,
  getPendingApprovals,
  updateApproval,
  cancelBooking,
  getAllBookings,
  downloadTicket
};
