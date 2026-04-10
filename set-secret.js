import fs from 'fs';
import { execSync } from 'child_process';

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/GOOGLE_SERVICE_ACCOUNT_KEY=(.+)/);

if (!match) {
  console.error('Could not find GOOGLE_SERVICE_ACCOUNT_KEY in .env');
  process.exit(1);
}

// Parse the credentials
const credentials = JSON.parse(match[1]);

// The private key already has actual \n characters from our fix-credentials script
// We need to output it as-is (JSON.stringify will handle escaping)
const credentialsString = JSON.stringify(credentials);

// Write to temp file
fs.writeFileSync('/tmp/firebase-secret.txt', credentialsString);

console.log('Setting Firebase secret...');
console.log('Credentials string length:', credentialsString.length);

// Use the temp file to set the secret
try {
  execSync('cat /tmp/firebase-secret.txt | firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_KEY', {
    stdio: 'inherit',
  });
  console.log('✅ Secret set successfully!');
  fs.unlinkSync('/tmp/firebase-secret.txt');
} catch (error) {
  console.error('Error setting secret:', error.message);
  fs.unlinkSync('/tmp/firebase-secret.txt');
  process.exit(1);
}
