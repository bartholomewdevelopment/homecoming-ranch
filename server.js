import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '1Ikt5YbB675yHYj7m0An0AwPeahg9D_GkIPNP2ViCzqQ';
const SHEET_NAME = process.env.SHEET_NAME || 'Sheet1';

/**
 * Initialize Google Sheets API client
 */
async function getGoogleSheetsClient() {
  try {
    // Parse the service account credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    return sheets;
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error.message);
    throw new Error('Failed to initialize Google Sheets API');
  }
}

/**
 * Format date and time in America/New_York timezone
 */
function getFormattedDateTime() {
  const now = new Date();

  const dateOptions = {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  const timeOptions = {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };

  const date = new Intl.DateTimeFormat('en-US', dateOptions).format(now);
  const time = new Intl.DateTimeFormat('en-US', timeOptions).format(now);

  return { date, time };
}

/**
 * Append row to Google Sheet
 */
async function appendToSheet(firstName, email, subscribedToNewsletter) {
  try {
    const sheets = await getGoogleSheetsClient();
    const { date, time } = getFormattedDateTime();

    // Convert newsletter subscription to TRUE/FALSE
    const newsletterValue = subscribedToNewsletter ? 'TRUE' : 'FALSE';

    // Prepare the row data matching the column order:
    // Date, Time, First Name, Email Address, Subscribed to Newsletter
    const values = [[date, time, firstName, email, newsletterValue]];

    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:E`, // Columns A through E
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values,
      },
    };

    const response = await sheets.spreadsheets.values.append(request);

    console.log('Successfully appended row to Google Sheet:', {
      spreadsheetId: SPREADSHEET_ID,
      updatedRange: response.data.updates.updatedRange,
      updatedRows: response.data.updates.updatedRows,
    });

    return response.data;
  } catch (error) {
    console.error('Error appending to Google Sheet:', error.message);
    throw error;
  }
}

/**
 * POST /api/recipe-signup
 * Handles recipe book email capture form submission
 */
app.post('/api/recipe-signup', async (req, res) => {
  try {
    // Validate required fields
    const { firstName, email, subscribedToNewsletter } = req.body;

    if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'First name is required',
      });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address',
      });
    }

    // Newsletter subscription is optional, default to false
    const isSubscribed = subscribedToNewsletter === true || subscribedToNewsletter === 'true';

    // Append to Google Sheet
    await appendToSheet(
      firstName.trim(),
      email.trim(),
      isSubscribed
    );

    res.json({
      success: true,
      message: 'Successfully recorded signup',
    });

  } catch (error) {
    console.error('Error in /api/recipe-signup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record signup. Please try again.',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/test-sheets
 * Test endpoint to verify Google Sheets connection
 */
app.get('/api/test-sheets', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();

    // Try to read the header row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:E1`,
    });

    res.json({
      success: true,
      message: 'Successfully connected to Google Sheets',
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME,
      headers: response.data.values ? response.data.values[0] : [],
    });
  } catch (error) {
    console.error('Error testing Google Sheets connection:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Google Sheets',
      details: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Test Google Sheets: http://localhost:${PORT}/api/test-sheets`);
});

export default app;
