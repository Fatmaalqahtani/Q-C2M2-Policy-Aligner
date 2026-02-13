const { query } = require('./database/database');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...\n');
    
    // Check users table
    console.log('📋 Users in database:');
    const users = await query('SELECT id, username, email, role FROM users');
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach(user => {
        console.log(`✅ User: ${user.username} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    // Check Q-C2M2 domains
    console.log('\n📋 Q-C2M2 Domains:');
    const domains = await query('SELECT domain_name, domain_code FROM qc2m2_domains');
    if (domains.length === 0) {
      console.log('❌ No domains found in database');
    } else {
      domains.forEach(domain => {
        console.log(`✅ Domain: ${domain.domain_name} (${domain.domain_code})`);
      });
    }
    
    // Check tags
    console.log('\n📋 Tags:');
    const tags = await query('SELECT name, color FROM tags');
    if (tags.length === 0) {
      console.log('❌ No tags found in database');
    } else {
      tags.forEach(tag => {
        console.log(`✅ Tag: ${tag.name} (${tag.color})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabase(); 