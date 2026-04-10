import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
dotenv.config();

const SPREADSHEET_ID =
  process.env.GOOGLE_SHEET_ID || '1Ikt5YbB675yHYj7m0An0AwPeahg9D_GkIPNP2ViCzqQ';
const SHEET_NAME = process.env.SHEET_NAME || 'Sheet1';

/**
 * Test script to verify Google Sheets API integration
 */
async function testGoogleSheets() {
  console.log('🧪 Testing Google Sheets Integration...\n');

  try {
    // Step 1: Check environment variables
    console.log('1️⃣ Checking environment variables...');
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in .env file');
    }
    console.log('✅ Environment variables loaded\n');

    // Step 2: Parse credentials
    console.log('2️⃣ Parsing service account credentials...');
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    // ✅ CRITICAL FIX: Convert literal "\\n" sequences into real newlines for the private key
    // dotenv single-line JSON keeps newlines escaped; OpenSSL requires real PEM line breaks.
    if (typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    // Optional sanity checks (helps catch malformed keys early)
    if (
      !credentials.private_key ||
      !credentials.private_key.includes('-----BEGIN PRIVATE KEY-----') ||
      !credentials.private_key.includes('-----END PRIVATE KEY-----')
    ) {
      throw new Error(
        '❌ private_key in GOOGLE_SERVICE_ACCOUNT_KEY looks malformed. Ensure it includes BEGIN/END PRIVATE KEY lines.'
      );
    }

    console.log(`✅ Service account email: ${credentials.client_email}\n`);

    // Step 3: Initialize Google Auth
    console.log('3️⃣ Initializing Google Auth...');
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log('✅ Google Auth initialized\n');

    // Step 4: Test reading from the sheet
    console.log('4️⃣ Testing read access to spreadsheet...');
    console.log(`   Spreadsheet ID: ${SPREADSHEET_ID}`);
    console.log(`   Sheet Name: ${SHEET_NAME}\n`);

    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:E1`,
    });

    if (readResponse.data.values) {
      console.log('✅ Successfully read from sheet');
      console.log('   Headers:', readResponse.data.values[0]);
    } else {
      console.log('⚠️  Sheet appears to be empty');
    }
    console.log('');

    // Step 5: Test writing to the sheet
    console.log('5️⃣ Testing write access (appending a test row)...');

    const now = new Date();

    // Use ISO-ish formats (cleaner in Sheets), still in America/New_York
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now); // YYYY-MM-DD

    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now); // HH:MM:SS

    const testValues = [[date, time, 'Test', 'User', 'TRUE']];

    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:E`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: testValues,
      },
    });

    console.log('✅ Successfully appended test row');
    console.log('   Updated Range:', appendResponse.data.updates.updatedRange);
    console.log('   Updated Rows:', appendResponse.data.updates.updatedRows);
    console.log('');

    console.log('🎉 All tests passed! Google Sheets integration is working correctly.\n');
    console.log('Next steps:');
    console.log('1. Check your Google Sheet to see the test row');
    console.log('2. Start the server with: npm run server');
    console.log('3. Test the API endpoint at: http://localhost:3001/api/test-sheets\n');
  } catch (error) {
    // Print more helpful error details
    console.error('❌ Test failed:', error?.message || error);

    // If this is an OpenSSL/decoder error, show the full stack for debugging
    if (error?.stack) {
      console.error('\nStack:\n', error.stack);
    }

    console.error('\nTroubleshooting:');
    console.error('1. Ensure GOOGLE_SERVICE_ACCOUNT_KEY is valid JSON');
    console.error('2. Ensure credentials.private_key includes BEGIN/END PRIVATE KEY lines');
    console.error('3. Share the Google Sheet with the service account email as an Editor');
    console.error('4. Confirm spreadsheet ID and sheet tab name are correct\n');
    process.exit(1);
  }
}

// Run the test
testGoogleSheets();