const pool = require('./database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('employee', 'approver', 'admin')),
        designation VARCHAR(50) NOT NULL,
        salary_band VARCHAR(20) NOT NULL,
        department VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Travel policies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS travel_policies (
        id SERIAL PRIMARY KEY,
        designation VARCHAR(50) NOT NULL,
        max_flight_class VARCHAR(20) NOT NULL DEFAULT 'economy',
        max_hotel_stars INTEGER NOT NULL DEFAULT 3,
        daily_allowance DECIMAL(10,2) NOT NULL DEFAULT 50.00,
        max_trip_duration INTEGER NOT NULL DEFAULT 7,
        requires_approval BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('flight', 'hotel')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' 
          CHECK (status IN ('pending', 'approved', 'rejected', 'ticketed', 'cancelled')),
        travel_date DATE NOT NULL,
        return_date DATE,
        from_city VARCHAR(100),
        to_city VARCHAR(100),
        hotel_name VARCHAR(100),
        hotel_city VARCHAR(100),
        check_in DATE,
        check_out DATE,
        flight_class VARCHAR(20),
        hotel_stars INTEGER,
        total_cost DECIMAL(10,2),
        policy_compliant BOOLEAN DEFAULT true,
        policy_violations TEXT[],
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Approvals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS approvals (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        approver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Approval delegations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS approval_delegations (
        id SERIAL PRIMARY KEY,
        original_approver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        delegated_to_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        start_date DATE,
        end_date DATE,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add delegated_from column to approvals table if not exists
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE approvals ADD COLUMN delegated_from INTEGER REFERENCES users(id);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // Search history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('flight', 'hotel')),
        search_params JSONB NOT NULL,
        results_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
      CREATE INDEX IF NOT EXISTS idx_approvals_booking_id ON approvals(booking_id);
      CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON approvals(approver_id);
      CREATE INDEX IF NOT EXISTS idx_delegations_original ON approval_delegations(original_approver_id);
      CREATE INDEX IF NOT EXISTS idx_delegations_delegated ON approval_delegations(delegated_to_id);
      CREATE INDEX IF NOT EXISTS idx_delegations_active ON approval_delegations(is_active);
    `);

    await client.query('COMMIT');
    console.log('Database migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
createTables()
  .then(() => {
    console.log('All tables created successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
