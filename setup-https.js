const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Setting up HTTPS for local development...');

// Create certificates directory if it doesn't exist
const certsDir = path.join(__dirname, 'certificates');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

// Generate self-signed certificate
try {
  console.log('📝 Generating self-signed certificate...');
  execSync(`openssl req -x509 -newkey rsa:2048 -keyout ${path.join(certsDir, 'key.pem')} -out ${path.join(certsDir, 'cert.pem')} -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
  
  console.log('✅ Certificate generated successfully!');
  console.log('📁 Certificates saved in:', certsDir);
  console.log('\n🚀 Now you can run: npm run dev:https');
} catch (error) {
  console.log('❌ Error generating certificate. Make sure OpenSSL is installed.');
  console.log('💡 Alternative: Use npm run dev (with --experimental-https)');
}
