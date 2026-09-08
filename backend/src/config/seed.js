const bcrypt = require('bcryptjs');
const pool = require('./database');

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Seed travel policies
    const policies = [
      { designation: 'Junior Executive', max_flight_class: 'economy', max_hotel_stars: 2, salary_min: 2, salary_max: 4, max_hotel_cost: 2500, max_flight_cost: 8000, requires_approval: true },
      { designation: 'Executive', max_flight_class: 'economy', max_hotel_stars: 3, salary_min: 4, salary_max: 7, max_hotel_cost: 4000, max_flight_cost: 12000, requires_approval: true },
      { designation: 'Senior Executive', max_flight_class: 'premium_economy', max_hotel_stars: 3, salary_min: 7, salary_max: 12, max_hotel_cost: 6000, max_flight_cost: 18000, requires_approval: true },
      { designation: 'Manager', max_flight_class: 'premium_economy', max_hotel_stars: 4, salary_min: 12, salary_max: 20, max_hotel_cost: 8000, max_flight_cost: 25000, requires_approval: true },
      { designation: 'Senior Manager', max_flight_class: 'business', max_hotel_stars: 4, salary_min: 15, salary_max: 25, max_hotel_cost: 10000, max_flight_cost: 30000, requires_approval: true },
      { designation: 'Director', max_flight_class: 'business', max_hotel_stars: 5, salary_min: 20, salary_max: 35, max_hotel_cost: 12000, max_flight_cost: 35000, requires_approval: false },
      { designation: 'VP', max_flight_class: 'business', max_hotel_stars: 5, salary_min: 30, salary_max: 50, max_hotel_cost: 15000, max_flight_cost: 40000, requires_approval: false },
      { designation: 'SVP', max_flight_class: 'first', max_hotel_stars: 5, salary_min: 40, salary_max: 70, max_hotel_cost: 20000, max_flight_cost: 50000, requires_approval: false },
      { designation: 'CEO/Founder', max_flight_class: 'first', max_hotel_stars: 5, salary_min: 60, salary_max: 100, max_hotel_cost: 25000, max_flight_cost: 60000, requires_approval: false }
    ];

    for (const policy of policies) {
      const existing = await client.query(
        'SELECT id FROM travel_policies WHERE designation = $1',
        [policy.designation]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE travel_policies
           SET max_flight_class = $1, max_hotel_stars = $2, salary_min_lakhs = $3,
               salary_max_lakhs = $4, max_hotel_cost_per_night = $5, max_flight_cost = $6,
               requires_approval = $7, updated_at = CURRENT_TIMESTAMP
           WHERE designation = $8`,
          [policy.max_flight_class, policy.max_hotel_stars, policy.salary_min, policy.salary_max, policy.max_hotel_cost, policy.max_flight_cost, policy.requires_approval, policy.designation]
        );
      } else {
        await client.query(
          `INSERT INTO travel_policies (designation, max_flight_class, max_hotel_stars, salary_min_lakhs, salary_max_lakhs, max_hotel_cost_per_night, max_flight_cost, requires_approval)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [policy.designation, policy.max_flight_class, policy.max_hotel_stars, policy.salary_min, policy.salary_max, policy.max_hotel_cost, policy.max_flight_cost, policy.requires_approval]
        );
      }
    }

    // Seed comprehensive organizational hierarchy
    const salt = await bcrypt.genSalt(10);
    const password = 'password123';

    // Complete organizational hierarchy - 39 employees total
    const users = [
      // Level 0: CEO (no manager)
      { name: 'Arjun Mehta', email: 'arjun.mehta@company.com', role: 'admin', designation: 'CEO/Founder', salary_band: 'F', department: 'Executive', manager_email: null },

      // Level 1: SVPs (report to CEO)
      { name: 'Priya Sharma', email: 'priya.sharma@company.com', role: 'approver', designation: 'SVP', salary_band: 'F', department: 'Engineering', manager_email: 'arjun.mehta@company.com' },
      { name: 'Vikram Patel', email: 'vikram.patel@company.com', role: 'approver', designation: 'SVP', salary_band: 'F', department: 'Sales', manager_email: 'arjun.mehta@company.com' },
      { name: 'Neha Gupta', email: 'neha.gupta@company.com', role: 'approver', designation: 'SVP', salary_band: 'F', department: 'Operations', manager_email: 'arjun.mehta@company.com' },
      { name: 'Rajesh Kumar', email: 'rajesh.kumar@company.com', role: 'approver', designation: 'SVP', salary_band: 'F', department: 'Finance', manager_email: 'arjun.mehta@company.com' },

      // Level 2: VPs (report to SVPs)
      { name: 'Ankit Singh', email: 'ankit.singh@company.com', role: 'approver', designation: 'VP', salary_band: 'E', department: 'Engineering', manager_email: 'priya.sharma@company.com' },
      { name: 'Deepika Reddy', email: 'deepika.reddy@company.com', role: 'approver', designation: 'VP', salary_band: 'E', department: 'Sales', manager_email: 'vikram.patel@company.com' },
      { name: 'Sanjay Nair', email: 'sanjay.nair@company.com', role: 'approver', designation: 'VP', salary_band: 'E', department: 'Operations', manager_email: 'neha.gupta@company.com' },
      { name: 'Kavita Joshi', email: 'kavita.joshi@company.com', role: 'approver', designation: 'VP', salary_band: 'E', department: 'Finance', manager_email: 'rajesh.kumar@company.com' },

      // Level 3: Directors (report to VPs)
      { name: 'Ravi Menon', email: 'ravi.menon@company.com', role: 'approver', designation: 'Director', salary_band: 'D', department: 'Engineering', manager_email: 'ankit.singh@company.com' },
      { name: 'Shweta Iyer', email: 'shweta.iyer@company.com', role: 'approver', designation: 'Director', salary_band: 'D', department: 'Sales', manager_email: 'deepika.reddy@company.com' },
      { name: 'Mohan Das', email: 'mohan.das@company.com', role: 'approver', designation: 'Director', salary_band: 'D', department: 'Operations', manager_email: 'sanjay.nair@company.com' },
      { name: 'Pooja Verma', email: 'pooja.verma@company.com', role: 'approver', designation: 'Director', salary_band: 'D', department: 'Finance', manager_email: 'kavita.joshi@company.com' },

      // Level 4: Senior Managers (report to Directors)
      { name: 'Arun Thakur', email: 'arun.thakur@company.com', role: 'approver', designation: 'Senior Manager', salary_band: 'C', department: 'Engineering', manager_email: 'ravi.menon@company.com' },
      { name: 'Nisha Chopra', email: 'nisha.chopra@company.com', role: 'approver', designation: 'Senior Manager', salary_band: 'C', department: 'Engineering', manager_email: 'ravi.menon@company.com' },
      { name: 'Suresh Pillai', email: 'suresh.pillai@company.com', role: 'approver', designation: 'Senior Manager', salary_band: 'C', department: 'Sales', manager_email: 'shweta.iyer@company.com' },
      { name: 'Meena Rao', email: 'meena.rao@company.com', role: 'approver', designation: 'Senior Manager', salary_band: 'C', department: 'Sales', manager_email: 'shweta.iyer@company.com' },
      { name: 'Vinod Kumar', email: 'vinod.kumar@company.com', role: 'approver', designation: 'Senior Manager', salary_band: 'C', department: 'Operations', manager_email: 'mohan.das@company.com' },
      { name: 'Anjali Bhat', email: 'anjali.bhat@company.com', role: 'approver', designation: 'Senior Manager', salary_band: 'C', department: 'Operations', manager_email: 'mohan.das@company.com' },
      { name: 'Ganesh Pillai', email: 'ganesh.pillai@company.com', role: 'approver', designation: 'Senior Manager', salary_band: 'C', department: 'Finance', manager_email: 'pooja.verma@company.com' },
      { name: 'Lakshmi Devi', email: 'lakshmi.devi@company.com', role: 'approver', designation: 'Senior Manager', salary_band: 'C', department: 'Finance', manager_email: 'pooja.verma@company.com' },

      // Level 5: Managers (report to Senior Managers)
      { name: 'Rahul Bose', email: 'rahul.bose@company.com', role: 'approver', designation: 'Manager', salary_band: 'B', department: 'Engineering', manager_email: 'arun.thakur@company.com' },
      { name: 'Kavitha Menon', email: 'kavitha.menon@company.com', role: 'approver', designation: 'Manager', salary_band: 'B', department: 'Engineering', manager_email: 'nisha.chopra@company.com' },
      { name: 'Aditya Roy', email: 'aditya.roy@company.com', role: 'approver', designation: 'Manager', salary_band: 'B', department: 'Sales', manager_email: 'suresh.pillai@company.com' },
      { name: 'Deepa Nair', email: 'deepa.nair@company.com', role: 'approver', designation: 'Manager', salary_band: 'B', department: 'Sales', manager_email: 'meena.rao@company.com' },
      { name: 'Vivek Sharma', email: 'vivek.sharma@company.com', role: 'approver', designation: 'Manager', salary_band: 'B', department: 'Operations', manager_email: 'vinod.kumar@company.com' },
      { name: 'Priyanka Singh', email: 'priyanka.singh@company.com', role: 'approver', designation: 'Manager', salary_band: 'B', department: 'Operations', manager_email: 'anjali.bhat@company.com' },
      { name: 'Srikant Reddy', email: 'srikant.reddy@company.com', role: 'approver', designation: 'Manager', salary_band: 'B', department: 'Finance', manager_email: 'ganesh.pillai@company.com' },
      { name: 'Meera Joshi', email: 'meera.joshi@company.com', role: 'approver', designation: 'Manager', salary_band: 'B', department: 'Finance', manager_email: 'lakshmi.devi@company.com' },

      // Level 6: Senior Executives (report to Managers)
      { name: 'Amit Deshmukh', email: 'amit.deshmukh@company.com', role: 'employee', designation: 'Senior Executive', salary_band: 'B', department: 'Engineering', manager_email: 'rahul.bose@company.com' },
      { name: 'Shreya Kulkarni', email: 'shreya.kulkarni@company.com', role: 'employee', designation: 'Senior Executive', salary_band: 'B', department: 'Engineering', manager_email: 'kavitha.menon@company.com' },
      { name: 'Rohan Malhotra', email: 'rohan.malhotra@company.com', role: 'employee', designation: 'Senior Executive', salary_band: 'B', department: 'Sales', manager_email: 'aditya.roy@company.com' },
      { name: 'Pallavi Gaikwad', email: 'pallavi.gaikwad@company.com', role: 'employee', designation: 'Senior Executive', salary_band: 'B', department: 'Operations', manager_email: 'vivek.sharma@company.com' },

      // Level 7: Executives (report to Senior Executives or Managers)
      { name: 'Karan Kapoor', email: 'karan.kapoor@company.com', role: 'employee', designation: 'Executive', salary_band: 'A', department: 'Engineering', manager_email: 'amit.deshmukh@company.com' },
      { name: 'Nandini Prasad', email: 'nandini.prasad@company.com', role: 'employee', designation: 'Executive', salary_band: 'A', department: 'Engineering', manager_email: 'shreya.kulkarni@company.com' },
      { name: 'Vishal Tandon', email: 'vishal.tandon@company.com', role: 'employee', designation: 'Executive', salary_band: 'A', department: 'Sales', manager_email: 'rohan.malhotra@company.com' },
      { name: 'Divya Chatterjee', email: 'divya.chatterjee@company.com', role: 'employee', designation: 'Executive', salary_band: 'A', department: 'Operations', manager_email: 'pallavi.gaikwad@company.com' },

      // Level 8: Junior Executives (report to Executives)
      { name: 'Siddharth Rao', email: 'siddharth.rao@company.com', role: 'employee', designation: 'Junior Executive', salary_band: 'A', department: 'Engineering', manager_email: 'karan.kapoor@company.com' },
      { name: 'Tanvi Kulkarni', email: 'tanvi.kulkarni@company.com', role: 'employee', designation: 'Junior Executive', salary_band: 'A', department: 'Engineering', manager_email: 'nandini.prasad@company.com' },
      { name: 'Gaurav Sharma', email: 'gaurav.sharma@company.com', role: 'employee', designation: 'Junior Executive', salary_band: 'A', department: 'Sales', manager_email: 'vishal.tandon@company.com' },
      { name: 'Ritu Agarwal', email: 'ritu.agarwal@company.com', role: 'employee', designation: 'Junior Executive', salary_band: 'A', department: 'Operations', manager_email: 'divya.chatterjee@company.com' },
    ];

    // Insert all users
    for (const user of users) {
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );

      if (existingUser.rows.length === 0) {
        const passwordHash = await bcrypt.hash(password, salt);
        await client.query(
          `INSERT INTO users (name, email, password_hash, role, designation, salary_band, department)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [user.name, user.email, passwordHash, user.role, user.designation, user.salary_band, user.department]
        );
      } else {
        await client.query(
          `UPDATE users 
           SET name = $1, role = $2, designation = $3, salary_band = $4, department = $5, updated_at = CURRENT_TIMESTAMP
           WHERE email = $6`,
          [user.name, user.role, user.designation, user.salary_band, user.department, user.email]
        );
      }
    }

    // Set up manager relationships (all users except CEO)
    for (const user of users) {
      if (user.manager_email) {
        await client.query(
          `UPDATE users SET manager_id = (SELECT id FROM users WHERE email = $1)
           WHERE email = $2 AND manager_id IS NULL`,
          [user.manager_email, user.email]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully with complete organizational hierarchy!');
    console.log('\n=== Complete Employee Directory ===');
    console.log('\n--- Executive Leadership (CEO) ---');
    console.log('Arjun Mehta (CEO/Founder): arjun.mehta@company.com / password123');
    
    console.log('\n--- Senior Vice Presidents (SVPs) ---');
    console.log('Priya Sharma (SVP Engineering): priya.sharma@company.com / password123');
    console.log('Vikram Patel (SVP Sales): vikram.patel@company.com / password123');
    console.log('Neha Gupta (SVP Operations): neha.gupta@company.com / password123');
    console.log('Rajesh Kumar (SVP Finance): rajesh.kumar@company.com / password123');
    
    console.log('\n--- Vice Presidents (VPs) ---');
    console.log('Ankit Singh (VP Engineering): ankit.singh@company.com / password123');
    console.log('Deepika Reddy (VP Sales): deepika.reddy@company.com / password123');
    console.log('Sanjay Nair (VP Operations): sanjay.nair@company.com / password123');
    console.log('Kavita Joshi (VP Finance): kavita.joshi@company.com / password123');
    
    console.log('\n--- Directors ---');
    console.log('Ravi Menon (Director Engineering): ravi.menon@company.com / password123');
    console.log('Shweta Iyer (Director Sales): shweta.iyer@company.com / password123');
    console.log('Mohan Das (Director Operations): mohan.das@company.com / password123');
    console.log('Pooja Verma (Director Finance): pooja.verma@company.com / password123');
    
    console.log('\n--- Senior Managers ---');
    console.log('Arun Thakur (Sr. Mgr Engineering): arun.thakur@company.com / password123');
    console.log('Nisha Chopra (Sr. Mgr Engineering): nisha.chopra@company.com / password123');
    console.log('Suresh Pillai (Sr. Mgr Sales): suresh.pillai@company.com / password123');
    console.log('Meena Rao (Sr. Mgr Sales): meena.rao@company.com / password123');
    console.log('Vinod Kumar (Sr. Mgr Operations): vinod.kumar@company.com / password123');
    console.log('Anjali Bhat (Sr. Mgr Operations): anjali.bhat@company.com / password123');
    console.log('Ganesh Pillai (Sr. Mgr Finance): ganesh.pillai@company.com / password123');
    console.log('Lakshmi Devi (Sr. Mgr Finance): lakshmi.devi@company.com / password123');
    
    console.log('\n--- Managers ---');
    console.log('Rahul Bose (Mgr Engineering): rahul.bose@company.com / password123');
    console.log('Kavitha Menon (Mgr Engineering): kavitha.menon@company.com / password123');
    console.log('Aditya Roy (Mgr Sales): aditya.roy@company.com / password123');
    console.log('Deepa Nair (Mgr Sales): deepa.nair@company.com / password123');
    console.log('Vivek Sharma (Mgr Operations): vivek.sharma@company.com / password123');
    console.log('Priyanka Singh (Mgr Operations): priyanka.singh@company.com / password123');
    console.log('Srikant Reddy (Mgr Finance): srikant.reddy@company.com / password123');
    console.log('Meera Joshi (Mgr Finance): meera.joshi@company.com / password123');
    
    console.log('\n--- Senior Executives ---');
    console.log('Amit Deshmukh (Sr. Exec Engineering): amit.deshmukh@company.com / password123');
    console.log('Shreya Kulkarni (Sr. Exec Engineering): shreya.kulkarni@company.com / password123');
    console.log('Rohan Malhotra (Sr. Exec Sales): rohan.malhotra@company.com / password123');
    console.log('Pallavi Gaikwad (Sr. Exec Operations): pallavi.gaikwad@company.com / password123');
    
    console.log('\n--- Executives ---');
    console.log('Karan Kapoor (Exec Engineering): karan.kapoor@company.com / password123');
    console.log('Nandini Prasad (Exec Engineering): nandini.prasad@company.com / password123');
    console.log('Vishal Tandon (Exec Sales): vishal.tandon@company.com / password123');
    console.log('Divya Chatterjee (Exec Operations): divya.chatterjee@company.com / password123');
    
    console.log('\n--- Junior Executives ---');
    console.log('Siddharth Rao (Jr. Exec Engineering): siddharth.rao@company.com / password123');
    console.log('Tanvi Kulkarni (Jr. Exec Engineering): tanvi.kulkarni@company.com / password123');
    console.log('Gaurav Sharma (Jr. Exec Sales): gaurav.sharma@company.com / password123');
    console.log('Ritu Agarwal (Jr. Exec Operations): ritu.agarwal@company.com / password123');
    
    console.log('\n=== Organizational Hierarchy ===');
    console.log('Total Employees: 39');
    console.log('Departments: Engineering, Sales, Operations, Finance, Executive');
    console.log('Reporting Chain: CEO -> SVP -> VP -> Director -> Senior Manager -> Manager -> Senior Executive -> Executive -> Junior Executive');
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
