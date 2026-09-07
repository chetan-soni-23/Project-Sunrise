const nodemailer = require('nodemailer');

// Create transporter once at module load
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_APP_PASSWORD, // Gmail App Password, not regular password
      },
    });
  }
  return transporter;
};

/**
 * Send booking approval email with e-ticket attached
 */
const sendApprovalEmail = async (user, booking, confirmationNumber) => {
  const isFlight = booking.booking_type === 'flight';
  const subject = `✅ Booking Approved — ${isFlight ? 'Flight' : 'Hotel'} ${isFlight ? `to ${booking.to_city}` : `at ${booking.hotel_city}`}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a56db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 5px 0 0; font-size: 12px; opacity: 0.9; }
        .body { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .confirmation { background: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #e5e7eb; }
        .confirmation h2 { color: #1a56db; margin: 0; font-size: 18px; }
        .confirmation .number { font-size: 16px; font-weight: bold; color: #111827; }
        .details { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 15px; }
        .details h3 { color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0 0 10px; }
        .details table { width: 100%; border-collapse: collapse; }
        .details td { padding: 5px 0; font-size: 14px; }
        .details td:first-child { color: #6b7280; width: 120px; }
        .details td:last-child { font-weight: 500; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .badge-compliant { background: #d1fae5; color: #065f46; }
        .badge-violation { background: #fee2e2; color: #991b1b; }
        .footer { text-align: center; padding: 15px; color: #9ca3af; font-size: 11px; }
        .cta { display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✈ Project Sunrise</h1>
          <p>Corporate Travel Management</p>
        </div>
        <div class="body">
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your ${isFlight ? 'flight' : 'hotel'} booking has been <strong style="color: #059669;">approved</strong>.</p>

          <div class="confirmation">
            <h2>Booking Confirmed</h2>
            <p class="number">${confirmationNumber}</p>
          </div>

          <div class="details">
            <h3>${isFlight ? 'Flight Details' : 'Hotel Details'}</h3>
            <table>
              ${isFlight ? `
                <tr><td>Route</td><td>${booking.from_city} → ${booking.to_city}</td></tr>
                <tr><td>Date</td><td>${new Date(booking.travel_date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td></tr>
                <tr><td>Class</td><td>${(booking.flight_class || 'Economy').replace(/_/g, ' ').toUpperCase()}</td></tr>
                <tr><td>Cost</td><td>₹${Number(booking.total_cost || 0).toLocaleString()}</td></tr>
              ` : `
                <tr><td>Hotel</td><td>${booking.hotel_name}</td></tr>
                <tr><td>City</td><td>${booking.hotel_city}</td></tr>
                <tr><td>Stars</td><td>${booking.hotel_stars} ★</td></tr>
                <tr><td>Check-in</td><td>${new Date(booking.check_in).toLocaleDateString('en-IN')}</td></tr>
                <tr><td>Check-out</td><td>${new Date(booking.check_out).toLocaleDateString('en-IN')}</td></tr>
                <tr><td>Cost</td><td>₹${Number(booking.total_cost || 0).toLocaleString()}</td></tr>
              `}
            </table>
          </div>

          <div class="details">
            <h3>Passenger / Guest</h3>
            <table>
              <tr><td>Name</td><td>${user.name}</td></tr>
              <tr><td>Designation</td><td>${user.designation}</td></tr>
              <tr><td>Department</td><td>${user.department || 'N/A'}</td></tr>
            </table>
          </div>

          <div class="details">
            <h3>Policy Compliance</h3>
            ${booking.policy_compliant
              ? '<span class="badge badge-compliant">✓ Compliant</span>'
              : `<span class="badge badge-violation">⚠ Out of Policy</span>
                 ${booking.justification ? `<p style="font-size: 13px; color: #6b7280; margin-top: 8px;"><em>Justification: ${booking.justification}</em></p>` : ''}`
            }
          </div>

          <p style="font-size: 13px; color: #6b7280;">Your e-ticket / booking confirmation is attached to this email. Please save it for your records.</p>
        </div>
        <div class="footer">
          <p>This is an automated email from Project Sunrise Corporate Travel System.</p>
          <p>Do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Project Sunrise" <${process.env.SMTP_EMAIL}>`,
    to: user.email,
    subject,
    html,
    attachments: booking._ticketPath ? [{
      filename: booking._ticketFilename,
      path: booking._ticketPath,
      contentType: 'application/pdf',
    }] : [],
  };

  return getTransporter().sendMail(mailOptions);
};

/**
 * Send booking rejection email
 */
const sendRejectionEmail = async (user, booking, rejectionReason) => {
  const isFlight = booking.booking_type === 'flight';
  const subject = `❌ Booking Rejected — ${isFlight ? 'Flight' : 'Hotel'} ${isFlight ? `to ${booking.to_city}` : `at ${booking.hotel_city}`}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 5px 0 0; font-size: 12px; opacity: 0.9; }
        .body { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .details { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 15px; }
        .details h3 { color: #6b7280; font-size: 12px; text-transform: uppercase; margin: 0 0 10px; }
        .details table { width: 100%; border-collapse: collapse; }
        .details td { padding: 5px 0; font-size: 14px; }
        .details td:first-child { color: #6b7280; width: 120px; }
        .details td:last-child { font-weight: 500; }
        .reason { background: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fecaca; margin: 15px 0; }
        .reason h3 { color: #991b1b; margin: 0 0 8px; font-size: 14px; }
        .reason p { margin: 0; color: #7f1d1d; font-size: 14px; }
        .footer { text-align: center; padding: 15px; color: #9ca3af; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✈ Project Sunrise</h1>
          <p>Corporate Travel Management</p>
        </div>
        <div class="body">
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Unfortunately, your ${isFlight ? 'flight' : 'hotel'} booking request has been <strong style="color: #dc2626;">rejected</strong>.</p>

          <div class="details">
            <h3>Booking Details</h3>
            <table>
              ${isFlight ? `
                <tr><td>Route</td><td>${booking.from_city} → ${booking.to_city}</td></tr>
                <tr><td>Date</td><td>${new Date(booking.travel_date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td></tr>
                <tr><td>Class</td><td>${(booking.flight_class || 'Economy').replace(/_/g, ' ').toUpperCase()}</td></tr>
                <tr><td>Cost</td><td>₹${Number(booking.total_cost || 0).toLocaleString()}</td></tr>
              ` : `
                <tr><td>Hotel</td><td>${booking.hotel_name}</td></tr>
                <tr><td>City</td><td>${booking.hotel_city}</td></tr>
                <tr><td>Stars</td><td>${booking.hotel_stars} ★</td></tr>
                <tr><td>Cost</td><td>₹${Number(booking.total_cost || 0).toLocaleString()}</td></tr>
              `}
            </table>
          </div>

          ${rejectionReason ? `
          <div class="reason">
            <h3>Reason for Rejection</h3>
            <p>${rejectionReason}</p>
          </div>
          ` : ''}

          <div class="details">
            <h3>What to do next</h3>
            <table>
              <tr><td style="color: #111827;">1.</td><td>Review the rejection reason above</td></tr>
              <tr><td style="color: #111827;">2.</td><td>Consider booking within your policy limits</td></tr>
              <tr><td style="color: #111827;">3.</td><td>Contact your manager if you need clarification</td></tr>
            </table>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email from Project Sunrise Corporate Travel System.</p>
          <p>Do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Project Sunrise" <${process.env.SMTP_EMAIL}>`,
    to: user.email,
    subject,
    html,
  };

  return getTransporter().sendMail(mailOptions);
};

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
};
