#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Q-C2M2 Policy Aligner Setup');
console.log('================================\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' });
  console.log(`✅ Node.js ${nodeVersion.trim()} detected`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js v16 or higher.');
  process.exit(1);
}

// Check if npm is installed
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' });
  console.log(`✅ npm ${npmVersion.trim()} detected`);
} catch (error) {
  console.error('❌ npm is not installed. Please install npm.');
  process.exit(1);
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Installing server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });
  
  console.log('Installing client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  console.log('✅ All dependencies installed successfully!');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n📝 Creating .env file...');
  const envContent = `PORT=5000
NODE_ENV=development
JWT_SECRET=qc2m2-policy-aligner-secret-key-${Date.now()}`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created');
} else {
  console.log('ℹ️  .env file already exists');
}

// Create uploads directory
const uploadsPath = path.join(__dirname, 'server', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  console.log('\n📁 Creating uploads directory...');
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ Uploads directory created');
} else {
  console.log('ℹ️  Uploads directory already exists');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Start the development servers: npm run dev');
console.log('2. Open http://localhost:3000 in your browser');
console.log('3. Login with: admin / password');
console.log('\n🚀 Happy analyzing!'); 