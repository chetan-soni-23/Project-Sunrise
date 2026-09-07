const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const TICKETS_DIR = path.join(__dirname, '../../tickets');

// Ensure tickets directory exists
if (!fs.existsSync(TICKETS_DIR)) {
  fs.mkdirSync(TICKETS_DIR, { recursive: true });
}

/**
 * Generate a unique confirmation number
 * Format: PS-{YEAR}-{4-digit random}
 */
const generateConfirmationNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PS-${year}-${random}`;
};

/**
 * Generate a flight e-ticket PDF
 */
const generateFlightTicket = (booking, user, policy) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filename = `flight-${booking.id}-${booking.confirmation_number}.pdf`;
    const filepath = path.join(TICKETS_DIR, filename);
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a56db')
      .text('✈ PROJECT SUNRISE', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
      .text('Corporate Travel Management System', { align: 'center' });
    doc.moveDown(0.5);

    // Divider
    drawDivider(doc);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#111827')
      .text('E-TICKET / BOARDING PASS', { align: 'center' });
    doc.moveDown(0.5);

    // Confirmation number
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a56db')
      .text(`Confirmation: ${booking.confirmation_number}`, { align: 'center' });
    doc.moveDown(1);

    // Flight Details Box
    drawBox(doc, 50, doc.y, 495, 120);
    const boxY = doc.y + 15;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280')
      .text('FLIGHT DETAILS', 65, boxY);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827');
    doc.text('Route:', 65, boxY + 22);
    doc.font('Helvetica').text(`${booking.from_city || 'N/A'}  →  ${booking.to_city || 'N/A'}`, 130, boxY + 22);

    doc.font('Helvetica-Bold').text('Date:', 65, boxY + 42);
    doc.font('Helvetica').text(formatDate(booking.travel_date), 130, boxY + 42);

    doc.font('Helvetica-Bold').text('Class:', 65, boxY + 62);
    doc.font('Helvetica').text((booking.flight_class || 'Economy').replace(/_/g, ' ').toUpperCase(), 130, boxY + 62);

    doc.font('Helvetica-Bold').text('Cost:', 65, boxY + 82);
    doc.font('Helvetica').text(`₹${Number(booking.total_cost || 0).toLocaleString()}`, 130, boxY + 82);

    doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
      .text(booking.notes || '', 300, boxY + 22, { width: 230 });

    doc.y = boxY + 110;

    // Passenger Details Box
    drawBox(doc, 50, doc.y + 10, 495, 80);
    const passY = doc.y + 25;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280')
      .text('PASSENGER DETAILS', 65, passY);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827');
    doc.text('Name:', 65, passY + 22);
    doc.font('Helvetica').text(user.name, 130, passY + 22);

    doc.font('Helvetica-Bold').text('Designation:', 65, passY + 42);
    doc.font('Helvetica').text(user.designation, 175, passY + 42);

    doc.font('Helvetica-Bold').text('Department:', 280, passY + 22);
    doc.font('Helvetica').text(user.department || 'N/A', 370, passY + 22);

    doc.font('Helvetica-Bold').text('Employee ID:', 280, passY + 42);
    doc.font('Helvetica').text(`EMP-${user.id}`, 370, passY + 42);

    doc.y = passY + 70;

    // Policy Compliance
    drawBox(doc, 50, doc.y + 10, 495, 60);
    const polY = doc.y + 25;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280')
      .text('POLICY COMPLIANCE', 65, polY);

    if (booking.policy_compliant) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#059669')
        .text('✓ Policy Compliant — This booking is within your travel policy limits.', 65, polY + 22);
    } else {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626')
        .text('⚠ Out of Policy — This booking exceeds standard policy limits.', 65, polY + 22);
      if (booking.justification) {
        doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
          .text(`Justification: ${booking.justification}`, 65, polY + 38, { width: 460 });
      }
    }

    doc.y = polY + 55;

    // Footer
    drawDivider(doc);
    doc.y += 10;
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
      .text('This is a system-generated e-ticket. No signature required.', { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()} | Project Sunrise Corporate Travel`, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve({ filepath, filename }));
    stream.on('error', reject);
  });
};

/**
 * Generate a hotel booking confirmation PDF
 */
const generateHotelTicket = (booking, user, policy) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filename = `hotel-${booking.id}-${booking.confirmation_number}.pdf`;
    const filepath = path.join(TICKETS_DIR, filename);
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a56db')
      .text('🏨 PROJECT SUNRISE', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
      .text('Corporate Travel Management System', { align: 'center' });
    doc.moveDown(0.5);

    drawDivider(doc);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#111827')
      .text('BOOKING CONFIRMATION', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a56db')
      .text(`Confirmation: ${booking.confirmation_number}`, { align: 'center' });
    doc.moveDown(1);

    // Hotel Details Box
    drawBox(doc, 50, doc.y, 495, 140);
    const boxY = doc.y + 15;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280')
      .text('HOTEL DETAILS', 65, boxY);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827');
    doc.text('Hotel:', 65, boxY + 22);
    doc.font('Helvetica').text(booking.hotel_name || 'N/A', 130, boxY + 22);

    doc.font('Helvetica-Bold').text('City:', 65, boxY + 42);
    doc.font('Helvetica').text(booking.hotel_city || 'N/A', 130, boxY + 42);

    doc.font('Helvetica-Bold').text('Stars:', 65, boxY + 62);
    doc.font('Helvetica').text(`${booking.hotel_stars || 'N/A'} ★`, 130, boxY + 62);

    doc.font('Helvetica-Bold').text('Check-in:', 65, boxY + 82);
    doc.font('Helvetica').text(formatDate(booking.check_in), 155, boxY + 82);

    doc.font('Helvetica-Bold').text('Check-out:', 280, boxY + 82);
    doc.font('Helvetica').text(formatDate(booking.check_out), 370, boxY + 82);

    const nights = booking.check_in && booking.check_out
      ? Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24))
      : 1;

    doc.font('Helvetica-Bold').text('Duration:', 65, boxY + 102);
    doc.font('Helvetica').text(`${nights} night(s)`, 155, boxY + 102);

    doc.font('Helvetica-Bold').text('Cost:', 280, boxY + 102);
    doc.font('Helvetica').text(`₹${Number(booking.total_cost || 0).toLocaleString()}`, 370, boxY + 102);

    doc.y = boxY + 130;

    // Guest Details Box
    drawBox(doc, 50, doc.y + 10, 495, 80);
    const guestY = doc.y + 25;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280')
      .text('GUEST DETAILS', 65, guestY);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827');
    doc.text('Name:', 65, guestY + 22);
    doc.font('Helvetica').text(user.name, 130, guestY + 22);

    doc.font('Helvetica-Bold').text('Designation:', 65, guestY + 42);
    doc.font('Helvetica').text(user.designation, 175, guestY + 42);

    doc.font('Helvetica-Bold').text('Department:', 280, guestY + 22);
    doc.font('Helvetica').text(user.department || 'N/A', 370, guestY + 22);

    doc.font('Helvetica-Bold').text('Employee ID:', 280, guestY + 42);
    doc.font('Helvetica').text(`EMP-${user.id}`, 370, guestY + 42);

    doc.y = guestY + 70;

    // Policy Compliance
    drawBox(doc, 50, doc.y + 10, 495, 60);
    const polY = doc.y + 25;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280')
      .text('POLICY COMPLIANCE', 65, polY);

    if (booking.policy_compliant) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#059669')
        .text('✓ Policy Compliant — This booking is within your travel policy limits.', 65, polY + 22);
    } else {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626')
        .text('⚠ Out of Policy — This booking exceeds standard policy limits.', 65, polY + 22);
      if (booking.justification) {
        doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
          .text(`Justification: ${booking.justification}`, 65, polY + 38, { width: 460 });
      }
    }

    doc.y = polY + 55;

    // Footer
    drawDivider(doc);
    doc.y += 10;
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
      .text('This is a system-generated booking confirmation. No signature required.', { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()} | Project Sunrise Corporate Travel`, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve({ filepath, filename }));
    stream.on('error', reject);
  });
};

// Helper: draw a horizontal divider
function drawDivider(doc) {
  const y = doc.y;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').lineWidth(1).stroke();
  doc.moveDown(0.5);
}

// Helper: draw a rounded rectangle box
function drawBox(doc, x, y, w, h) {
  doc.save()
    .roundedRect(x, y, w, h, 8)
    .fillColor('#f9fafb')
    .fill()
    .restore();
  doc.save()
    .roundedRect(x, y, w, h, 8)
    .strokeColor('#e5e7eb')
    .lineWidth(1)
    .stroke()
    .restore();
}

// Helper: format date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

module.exports = {
  generateConfirmationNumber,
  generateFlightTicket,
  generateHotelTicket
};
