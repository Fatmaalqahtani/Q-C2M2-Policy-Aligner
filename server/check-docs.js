const { query } = require('./database/database');

async function checkDocuments() {
  try {
    console.log('🔍 Checking documents in database...\n');
    
    const documents = await query('SELECT id, filename, original_name FROM documents');
    
    if (documents.length === 0) {
      console.log('❌ No documents found in database');
    } else {
      console.log('📋 Documents in database:');
      documents.forEach(doc => {
        console.log(`✅ ID: ${doc.id}, Filename: ${doc.filename}, Original: ${doc.original_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking documents:', error);
  }
}

checkDocuments(); 