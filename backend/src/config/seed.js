const bcrypt = require('bcryptjs');
const pool = require('./database');

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Seed travel policies
    const policies = [
      { designation: 'Junior Executive', max_flight_class: 'economy', max_hotel_stars: 2, daily_allowance: 50, max_trip_duration: 5, requires_approval: true },
      { designation: 'Executive', max_flight_class: 'economy', max_hotel_stars: 3, daily_allowance: 75, max_trip_duration: 7, requires_approval: true },
      { designation: 'Senior Executive', max_flight_class: 'premium_economy', max_hotel_stars: 3, daily_allowance: 100, max_trip_duration: 7, requires_approval: true },
      { designation: 'Manager', max_flight_class: 'premium_economy', max_hotel_stars: 4, daily_allowance: 125, max_trip_duration: 10, requires_approval: true },
      { designation: 'Senior Manager', max_flight_class: 'business', max_hotel_stars: 4, daily_allowance: 150, max_trip_duration: 10, requires_approval: true },
      { designation: 'Director', max_flight_class: 'business', max_hotel_stars: 5, daily_allowance: 200, max_trip_duration: 14, requires_approval: false },
      { designation: 'VP', max_flight_class: 'business', max_hotel_stars: 5, daily_allowance: 250, max_trip_duration: 14, requires_approval: false },
      { designation: 'SVP', max_flight_class: 'first', max_hotel_stars: 5, daily_allowance: 300, max_trip_duration: 21, requires_approval: false }
    ];

    for (const policy of policies) {
      await client.query(
        `INSERT INTO travel_policies (designation, max_flight_class, max_hotel_stars, daily_allowance, max_trip_duration, requires_approval)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [policy.designation, policy.max_flight_class, policy.max_hotel_stars, policy.daily_allowance, policy.max_trip_duration, policy.requires_approval]
      );
    }

    // Seed test users
    const salt = await bcrypt.genSalt(10);
    const testUsers = [
      { name: 'John Employee', email: 'employee@test.com', password: 'password123', role: 'employee', designation: 'Executive', salary_band: 'B', department: 'Engineering' },
      { name: 'Jane Manager', email: 'approver@test.com', password: 'password123', role: 'approver', designation: 'Manager', salary_band: 'D', department: 'Engineering' },
      { name: 'Admin User', email: 'admin@test.com', password: 'password123', role: 'admin', designation: 'Director', salary_band: 'E', department: 'Operations' }
    ];

    for (const user of testUsers) {
      const passwordHash = await bcrypt.hash(user.password, salt);
      await client.query(
        `INSERT INTO users (name, email, password_hash, role, designation, salary_band, department)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [user.name, user.email, passwordHash, user.role, user.designation, user.salary_band, user.department]
      );
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
    console.log('\nTest Users:');
    console.log('Employee: employee@test.com / password123');
    console.log('Approver: approver@test.com / password123');
    console.log('Admin: admin@test.com / password123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seeding
seedData()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  });
