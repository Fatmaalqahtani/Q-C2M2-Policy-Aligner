const fs = require('fs');
const path = require('path');

async function testPDF() {
  try {
    console.log('🔍 Testing PDF file...\n');
    
    const filePath = path.join(__dirname, 'uploads', 'document-1754551195295-857164735.pdf');
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ PDF file not found');
      return;
    }
    
    const stats = fs.statSync(filePath);
    console.log('✅ PDF file found:');
    console.log(`   Path: ${filePath}`);
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Created: ${stats.birthTime}`);
    
    // Check if it's actually a PDF by reading the first few bytes
    const buffer = fs.readFileSync(filePath);
    const header = buffer.toString('ascii', 0, 4);
    console.log(`   Header: ${header}`);
    
    if (header === '%PDF') {
      console.log('✅ Valid PDF file detected');
    } else {
      console.log('❌ Not a valid PDF file');
    }
    
  } catch (error) {
    console.error('❌ Error testing PDF:', error);
  }
}

testPDF(); 