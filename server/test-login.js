const bcrypt = require('bcryptjs');
const { queryOne } = require('./database/database');

async function testLogin() {
  try {
    console.log('🔍 Testing login functionality...\n');
    
    // Test 1: Check if admin user exists
    console.log('1. Checking if admin user exists...');
    const adminUser = await queryOne(
      'SELECT id, username, email, password_hash, role FROM users WHERE username = ?',
      ['admin']
    );
    
    if (!adminUser) {
      console.log('❌ Admin user not found in database');
      return;
    }
    
    console.log(`✅ Admin user found: ${adminUser.username} (${adminUser.email})`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Password hash: ${adminUser.password_hash.substring(0, 20)}...`);
    
    // Test 2: Test password verification
    console.log('\n2. Testing password verification...');
    const testPassword = 'password';
    const isValidPassword = await bcrypt.compare(testPassword, adminUser.password_hash);
    
    if (isValidPassword) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
    }
    
    // Test 3: Try to find user by email too
    console.log('\n3. Testing login with email...');
    const userByEmail = await queryOne(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = ?',
      ['admin@qc2m2.com']
    );
    
    if (userByEmail) {
      console.log(`✅ User found by email: ${userByEmail.username}`);
    } else {
      console.log('❌ User not found by email');
    }
    
  } catch (error) {
    console.error('❌ Error testing login:', error);
  }
}

testLogin(); 