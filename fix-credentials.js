import fs from 'fs';
import dotenv from 'dotenv';

// Load current .env
dotenv.config();

console.log('🔧 Fixing Google Service Account Credentials...\n');

try {
  // Parse the current credentials
  const credentialsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!credentialsStr) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in .env file');
    process.exit(1);
  }

  // Parse JSON
  const credentials = JSON.parse(credentialsStr);

  console.log('✅ Successfully parsed credentials JSON');
  console.log(`   Service account: ${credentials.client_email}\n`);

  // Fix the private key by replacing literal \n with actual newlines
  if (credentials.private_key) {
    // Replace escaped newlines with actual newlines
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    console.log('✅ Fixed private key formatting\n');

    // Show a preview of the key (first and last few chars)
    const keyPreview = credentials.private_key.substring(0, 50) + '...' +
                      credentials.private_key.substring(credentials.private_key.length - 50);
    console.log('   Private key preview:');
    console.log('   ' + keyPreview.replace(/\n/g, '\\n') + '\n');
  }

  // Read current .env file
  const envPath = '.env';
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Create the properly formatted JSON string
  // We need to escape quotes and backslashes, but keep actual newlines in the private key
  const fixedCredentials = JSON.stringify(credentials);

  // Update the .env file
  const envLines = envContent.split('\n');
  const newEnvLines = [];
  let inCredentials = false;

  for (const line of envLines) {
    if (line.startsWith('GOOGLE_SERVICE_ACCOUNT_KEY=')) {
      newEnvLines.push(`GOOGLE_SERVICE_ACCOUNT_KEY=${fixedCredentials}`);
      inCredentials = true;
    } else if (!inCredentials) {
      newEnvLines.push(line);
    } else if (line.includes('=') && !line.startsWith(' ') && !line.startsWith('\t')) {
      inCredentials = false;
      newEnvLines.push(line);
    }
  }

  // Write back to .env
  fs.writeFileSync(envPath, newEnvLines.join('\n'));

  console.log('✅ Updated .env file with fixed credentials\n');
  console.log('🎉 Credentials fixed! Now try running: npm run test:sheets\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n💡 Alternative approach:');
  console.error('1. Download your service account JSON file again from Google Cloud');
  console.error('2. Run this command to create a properly formatted .env entry:\n');
  console.error('   node -e "console.log(\'GOOGLE_SERVICE_ACCOUNT_KEY=\' + JSON.stringify(require(\'./path-to-your-key.json\')))" >> .env.new\n');
  console.error('3. Copy the line from .env.new to your .env file\n');
  process.exit(1);
}
