#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔑 Google Service Account Credential Loader\n');
console.log('This script helps you properly load your service account JSON file into .env\n');

// Check if a file path was provided
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node load-credentials.js <path-to-service-account-key.json>\n');
  console.log('Example:');
  console.log('  node load-credentials.js ~/Downloads/homecoming-recipe-books-key.json\n');
  process.exit(0);
}

const keyFilePath = args[0];

try {
  // Check if file exists
  if (!fs.existsSync(keyFilePath)) {
    console.error(`❌ File not found: ${keyFilePath}\n`);
    console.error('Please provide the correct path to your service account JSON file.\n');
    process.exit(1);
  }

  console.log(`📂 Reading file: ${keyFilePath}`);

  // Read and parse the JSON file
  const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
  const credentials = JSON.parse(keyFileContent);

  console.log('✅ Successfully parsed JSON file');
  console.log(`   Service account: ${credentials.client_email}`);
  console.log(`   Project ID: ${credentials.project_id}\n`);

  // Verify required fields
  const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
  const missingFields = requiredFields.filter(field => !credentials[field]);

  if (missingFields.length > 0) {
    console.error(`❌ Missing required fields: ${missingFields.join(', ')}\n`);
    process.exit(1);
  }

  // Create the .env entry
  const credentialsStr = JSON.stringify(credentials);

  // Read existing .env or create new one
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📝 Found existing .env file');
  } else {
    console.log('📝 Creating new .env file');
    // Copy from .env.example if it exists
    const examplePath = path.join(__dirname, '.env.example');
    if (fs.existsSync(examplePath)) {
      envContent = fs.readFileSync(examplePath, 'utf8');
    }
  }

  // Update or add GOOGLE_SERVICE_ACCOUNT_KEY
  const lines = envContent.split('\n');
  let found = false;
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('GOOGLE_SERVICE_ACCOUNT_KEY=')) {
      // Replace existing key
      newLines.push(`GOOGLE_SERVICE_ACCOUNT_KEY=${credentialsStr}`);
      found = true;
    } else {
      newLines.push(line);
    }
  }

  // If not found, add it
  if (!found) {
    newLines.push(`GOOGLE_SERVICE_ACCOUNT_KEY=${credentialsStr}`);
  }

  // Write back to .env
  fs.writeFileSync(envPath, newLines.join('\n'));

  console.log('✅ Updated .env file with service account credentials\n');
  console.log('🎉 Setup complete!\n');
  console.log('Next steps:');
  console.log('1. Make sure you shared the Google Sheet with: ' + credentials.client_email);
  console.log('2. Run: npm run test:sheets\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nPlease make sure:');
  console.error('1. The file path is correct');
  console.error('2. The file contains valid JSON');
  console.error('3. It is a valid Google service account key file\n');
  process.exit(1);
}
