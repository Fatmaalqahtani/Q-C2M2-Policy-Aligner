const { initDatabase, run, queryOne } = require('./database/database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Initialize database tables
    await initDatabase();
    
    // Create default admin user
    const adminPassword = 'password';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    
    // Check if admin user already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );
    
    if (!existingUser) {
      await run(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@qc2m2.com', passwordHash, 'admin']
      );
      console.log('✅ Default admin user created');
      console.log('   Username: admin');
      console.log('   Password: password');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    console.log('✅ Database initialization complete!');
    console.log('🚀 You can now start the application');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 