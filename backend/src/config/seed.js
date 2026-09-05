const bcrypt = require('bcryptjs');
const pool = require('./database');

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Seed travel policies
    const policies = [
      { designation: 'Junior Executive', max_flight_class: 'economy', max_hotel_stars: 2, requires_approval: true },
      { designation: 'Executive', max_flight_class: 'economy', max_hotel_stars: 3, requires_approval: true },
      { designation: 'Senior Executive', max_flight_class: 'premium_economy', max_hotel_stars: 3, requires_approval: true },
      { designation: 'Manager', max_flight_class: 'premium_economy', max_hotel_stars: 4, requires_approval: true },
      { designation: 'Senior Manager', max_flight_class: 'business', max_hotel_stars: 4, requires_approval: true },
      { designation: 'Director', max_flight_class: 'business', max_hotel_stars: 5, requires_approval: false },
      { designation: 'VP', max_flight_class: 'business', max_hotel_stars: 5, requires_approval: false },
      { designation: 'SVP', max_flight_class: 'first', max_hotel_stars: 5, requires_approval: false },
      { designation: 'CEO/Founder', max_flight_class: 'first', max_hotel_stars: 5, requires_approval: false }
    ];

    for (const policy of policies) {
      await client.query(
        `INSERT INTO travel_policies (designation, max_flight_class, max_hotel_stars, requires_approval)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [policy.designation, policy.max_flight_class, policy.max_hotel_stars, policy.requires_approval]
      );
    }

    // Seed test users
    const salt = await bcrypt.genSalt(10);
    const testUsers = [
      // Employees
      { name: 'John Employee', email: 'employee@test.com', password: 'password123', role: 'employee', designation: 'Executive', salary_band: 'B', department: 'Engineering' },
      { name: 'Priya Developer', email: 'priya@test.com', password: 'password123', role: 'employee', designation: 'Senior Executive', salary_band: 'C', department: 'Engineering' },
      { name: 'Amit Analyst', email: 'amit@test.com', password: 'password123', role: 'employee', designation: 'Junior Executive', salary_band: 'A', department: 'Finance' },
      
      // Approvers
      { name: 'Jane Manager', email: 'approver@test.com', password: 'password123', role: 'approver', designation: 'Manager', salary_band: 'D', department: 'Engineering' },
      { name: 'Vikram Sen.Mgr', email: 'vikram@test.com', password: 'password123', role: 'approver', designation: 'Senior Manager', salary_band: 'D', department: 'Engineering' },
      { name: 'Neha Director', email: 'neha@test.com', password: 'password123', role: 'approver', designation: 'Director', salary_band: 'E', department: 'Finance' },
      { name: 'Raj VP', email: 'raj@test.com', password: 'password123', role: 'approver', designation: 'VP', salary_band: 'F', department: 'Operations' },
      
      // Admin
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

    // Set up manager relationships (employees -> their department approvers)
    // John (Engineering employee) -> Jane (Engineering Manager)
    await client.query(
      `UPDATE users SET manager_id = (SELECT id FROM users WHERE email = 'approver@test.com')
       WHERE email = 'employee@test.com' AND manager_id IS NULL`
    );
    // Priya (Engineering employee) -> Vikram (Engineering Senior Manager)
    await client.query(
      `UPDATE users SET manager_id = (SELECT id FROM users WHERE email = 'vikram@test.com')
       WHERE email = 'priya@test.com' AND manager_id IS NULL`
    );
    // Amit (Finance employee) -> Neha (Finance Director)
    await client.query(
      `UPDATE users SET manager_id = (SELECT id FROM users WHERE email = 'neha@test.com')
       WHERE email = 'amit@test.com' AND manager_id IS NULL`
    );
    // Vikram (Senior Manager) -> Raj (VP)
    await client.query(
      `UPDATE users SET manager_id = (SELECT id FROM users WHERE email = 'raj@test.com')
       WHERE email = 'vikram@test.com' AND manager_id IS NULL`
    );
    // Jane (Manager) -> Vikram (Senior Manager)
    await client.query(
      `UPDATE users SET manager_id = (SELECT id FROM users WHERE email = 'vikram@test.com')
       WHERE email = 'approver@test.com' AND manager_id IS NULL`
    );

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
    console.log('\nTest Users:');
    console.log('\n--- Employees ---');
    console.log('John: employee@test.com / password123');
    console.log('Priya: priya@test.com / password123');
    console.log('Amit: amit@test.com / password123');
    console.log('\n--- Approvers ---');
    console.log('Jane: approver@test.com / password123');
    console.log('Vikram: vikram@test.com / password123');
    console.log('Neha: neha@test.com / password123');
    console.log('Raj: raj@test.com / password123');
    console.log('\n--- Admin ---');
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
