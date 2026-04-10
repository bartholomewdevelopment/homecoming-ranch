import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { google } from 'googleapis';
import {
  checkRateLimit,
  sanitizeString,
  isValidEmail,
  isValidPhone,
  applyCORS,
  getClientIP,
  validateAdminPassword,
  verifyRecaptcha,
} from './security.js';

// Define secrets
const googleServiceAccountKey = defineSecret('GOOGLE_SERVICE_ACCOUNT_KEY');
const adminPassword = defineSecret('ADMIN_PASSWORD');
const recaptchaSecretKey = defineSecret('RECAPTCHA_SECRET_KEY');

// Google Sheets configuration
const SPREADSHEET_ID = '1Ikt5YbB675yHYj7m0An0AwPeahg9D_GkIPNP2ViCzqQ';
const SHEET_NAME = 'Leads';

// Allowed origins for CORS (update with your production domain)
const ALLOWED_ORIGINS = [
  'https://homecomingranch.com',
  'https://www.homecomingranch.com',
  'https://homecoming-ranch-1c2d9.web.app',
  'https://homecoming-ranch-1c2d9.firebaseapp.com',
  'http://localhost:5173', // Vite dev server
  'http://localhost:5000', // Firebase emulator
];

/**
 * Initialize Google Sheets API client
 */
async function getGoogleSheetsClient() {
  try {
    // Get credentials from secret and parse
    const credentialsString = googleServiceAccountKey.value();
    const credentials = JSON.parse(credentialsString);

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
 * Append row to Google Sheet - Recipe Book
 */
async function appendToRecipeSheet(firstName, email, subscribedToNewsletter) {
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
      range: `${SHEET_NAME}!A:E`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values,
      },
    };

    const response = await sheets.spreadsheets.values.append(request);

    console.log('Successfully appended row to Recipe Sheet:', {
      spreadsheetId: SPREADSHEET_ID,
      updatedRange: response.data.updates.updatedRange,
      updatedRows: response.data.updates.updatedRows,
    });

    return response.data;
  } catch (error) {
    console.error('Error appending to Recipe Sheet:', error.message);
    throw error;
  }
}

/**
 * Append row to Google Sheet - Contact Us
 */
async function appendToContactSheet(formData) {
  try {
    const sheets = await getGoogleSheetsClient();
    const { date, time } = getFormattedDateTime();

    // Convert newsletter subscription to TRUE/FALSE
    const newsletterValue = formData.subscribedToNewsletter ? 'TRUE' : 'FALSE';

    // Prepare the row data matching the column order:
    // Date, Time, First Name, Last Name, Email, Phone, How Did You Hear About Us?, Subscribe to Newsletter?, Comments
    const values = [[
      date,
      time,
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone,
      formData.referralSource || '',
      newsletterValue,
      formData.comments || '',
    ]];

    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: 'Contact Us!A:I',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values,
      },
    };

    const response = await sheets.spreadsheets.values.append(request);

    console.log('Successfully appended row to Contact Us Sheet:', {
      spreadsheetId: SPREADSHEET_ID,
      updatedRange: response.data.updates.updatedRange,
      updatedRows: response.data.updates.updatedRows,
    });

    return response.data;
  } catch (error) {
    console.error('Error appending to Contact Us Sheet:', error.message);
    throw error;
  }
}

/**
 * Append row to Google Sheet - Buy Meat
 */
async function appendToBuyMeatSheet(formData) {
  try {
    const sheets = await getGoogleSheetsClient();
    const { date, time } = getFormattedDateTime();

    // Convert newsletter subscription to TRUE/FALSE
    const newsletterValue = formData.subscribedToNewsletter ? 'TRUE' : 'FALSE';

    // Prepare the row data matching the column order:
    // Date, Time, First Name, Last Name, Email, Phone, Which Product Are You Inquiring About?, How Did You Hear About Us?, Subscribe to Newsletter?, Comments
    const values = [[
      date,
      time,
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone,
      formData.product || '',
      formData.referralSource || '',
      newsletterValue,
      formData.comments || '',
    ]];

    const request = {
      spreadsheetId: SPREADSHEET_ID,
      range: 'Buy Meat!A:J',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values,
      },
    };

    const response = await sheets.spreadsheets.values.append(request);

    console.log('Successfully appended row to Buy Meat Sheet:', {
      spreadsheetId: SPREADSHEET_ID,
      updatedRange: response.data.updates.updatedRange,
      updatedRows: response.data.updates.updatedRows,
    });

    return response.data;
  } catch (error) {
    console.error('Error appending to Buy Meat Sheet:', error.message);
    throw error;
  }
}

/**
 * Cloud Function: recipeSignup
 * Handles recipe book email capture form submission
 */
export const recipeSignup = onRequest(
  {
    cors: false, // We'll handle CORS manually for better security
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, recaptchaSecretKey],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({
        success: false,
        error: 'Origin not allowed',
      });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.',
      });
      return;
    }

    // Rate limiting: 10 requests per minute per IP
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    try {
      // Validate required fields
      const { firstName, email, subscribedToNewsletter, recaptchaToken } = req.body;

      // Verify reCAPTCHA
      const recaptchaResult = await verifyRecaptcha(
        recaptchaToken,
        recaptchaSecretKey.value(),
        'recipe_submit',
        0.5
      );

      if (!recaptchaResult.success) {
        res.status(400).json({
          success: false,
          error: 'Bot detection failed. Please try again.',
        });
        return;
      }

      if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'First name is required',
        });
        return;
      }

      if (!email || typeof email !== 'string' || email.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      // Validate and sanitize inputs
      const sanitizedFirstName = sanitizeString(firstName, 100);
      const sanitizedEmail = email.trim().toLowerCase();

      if (sanitizedFirstName.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid first name',
        });
        return;
      }

      if (!isValidEmail(sanitizedEmail)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email address',
        });
        return;
      }

      // Newsletter subscription is optional, default to false
      const isSubscribed = subscribedToNewsletter === true || subscribedToNewsletter === 'true';

      // Append to Google Sheet
      await appendToRecipeSheet(
        sanitizedFirstName,
        sanitizedEmail,
        isSubscribed
      );

      res.json({
        success: true,
        message: 'Successfully recorded signup',
      });

    } catch (error) {
      console.error('Error in recipeSignup:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record signup. Please try again.',
      });
    }
  }
);

/**
 * Cloud Function: contactSubmit
 * Handles contact form submission
 */
export const contactSubmit = onRequest(
  {
    cors: false, // We'll handle CORS manually for better security
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, recaptchaSecretKey],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({
        success: false,
        error: 'Origin not allowed',
      });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.',
      });
      return;
    }

    // Rate limiting: 10 requests per minute per IP
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    try {
      const { firstName, lastName, email, phone, referralSource, subscribedToNewsletter, comments, recaptchaToken } = req.body;

      // Verify reCAPTCHA
      const recaptchaResult = await verifyRecaptcha(
        recaptchaToken,
        recaptchaSecretKey.value(),
        'contact_submit',
        0.5
      );

      if (!recaptchaResult.success) {
        res.status(400).json({
          success: false,
          error: 'Bot detection failed. Please try again.',
        });
        return;
      }

      // Validate required fields
      if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
        res.status(400).json({ success: false, error: 'First name is required' });
        return;
      }

      if (!lastName || typeof lastName !== 'string' || lastName.trim() === '') {
        res.status(400).json({ success: false, error: 'Last name is required' });
        return;
      }

      if (!email || typeof email !== 'string' || email.trim() === '') {
        res.status(400).json({ success: false, error: 'Email is required' });
        return;
      }

      if (!phone || typeof phone !== 'string' || phone.trim() === '') {
        res.status(400).json({ success: false, error: 'Phone is required' });
        return;
      }

      if (!referralSource || typeof referralSource !== 'string' || referralSource.trim() === '') {
        res.status(400).json({ success: false, error: 'Referral source is required' });
        return;
      }

      // Validate and sanitize inputs
      const sanitizedFirstName = sanitizeString(firstName, 100);
      const sanitizedLastName = sanitizeString(lastName, 100);
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedPhone = phone.trim();
      const sanitizedReferralSource = sanitizeString(referralSource, 200);
      const sanitizedComments = comments ? sanitizeString(comments, 1000) : '';

      if (sanitizedFirstName.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid first name',
        });
        return;
      }

      if (sanitizedLastName.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid last name',
        });
        return;
      }

      if (!isValidEmail(sanitizedEmail)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email address',
        });
        return;
      }

      if (!isValidPhone(sanitizedPhone)) {
        res.status(400).json({
          success: false,
          error: 'Invalid phone number',
        });
        return;
      }

      const isSubscribed = subscribedToNewsletter === true || subscribedToNewsletter === 'true';

      // Append to Contact Us sheet
      await appendToContactSheet({
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        referralSource: sanitizedReferralSource,
        subscribedToNewsletter: isSubscribed,
        comments: sanitizedComments,
      });

      res.json({
        success: true,
        message: 'Successfully recorded contact form',
      });

    } catch (error) {
      console.error('Error in contactSubmit:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record contact form. Please try again.',
      });
    }
  }
);

/**
 * Cloud Function: buyMeatSubmit
 * Handles buy meat form submission
 */
export const buyMeatSubmit = onRequest(
  {
    cors: false, // We'll handle CORS manually for better security
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, recaptchaSecretKey],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({
        success: false,
        error: 'Origin not allowed',
      });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.',
      });
      return;
    }

    // Rate limiting: 10 requests per minute per IP
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    try {
      const { firstName, lastName, email, phone, product, referralSource, subscribedToNewsletter, comments, recaptchaToken } = req.body;

      // Verify reCAPTCHA
      const recaptchaResult = await verifyRecaptcha(
        recaptchaToken,
        recaptchaSecretKey.value(),
        'buy_meat_submit',
        0.5
      );

      if (!recaptchaResult.success) {
        res.status(400).json({
          success: false,
          error: 'Bot detection failed. Please try again.',
        });
        return;
      }

      // Validate required fields
      if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
        res.status(400).json({ success: false, error: 'First name is required' });
        return;
      }

      if (!lastName || typeof lastName !== 'string' || lastName.trim() === '') {
        res.status(400).json({ success: false, error: 'Last name is required' });
        return;
      }

      if (!email || typeof email !== 'string' || email.trim() === '') {
        res.status(400).json({ success: false, error: 'Email is required' });
        return;
      }

      if (!phone || typeof phone !== 'string' || phone.trim() === '') {
        res.status(400).json({ success: false, error: 'Phone is required' });
        return;
      }

      if (!product || typeof product !== 'string' || product.trim() === '') {
        res.status(400).json({ success: false, error: 'Product selection is required' });
        return;
      }

      if (!referralSource || typeof referralSource !== 'string' || referralSource.trim() === '') {
        res.status(400).json({ success: false, error: 'Referral source is required' });
        return;
      }

      // Validate and sanitize inputs
      const sanitizedFirstName = sanitizeString(firstName, 100);
      const sanitizedLastName = sanitizeString(lastName, 100);
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedPhone = phone.trim();
      const sanitizedProduct = sanitizeString(product, 200);
      const sanitizedReferralSource = sanitizeString(referralSource, 200);
      const sanitizedComments = comments ? sanitizeString(comments, 1000) : '';

      if (sanitizedFirstName.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid first name',
        });
        return;
      }

      if (sanitizedLastName.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid last name',
        });
        return;
      }

      if (!isValidEmail(sanitizedEmail)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email address',
        });
        return;
      }

      if (!isValidPhone(sanitizedPhone)) {
        res.status(400).json({
          success: false,
          error: 'Invalid phone number',
        });
        return;
      }

      const isSubscribed = subscribedToNewsletter === true || subscribedToNewsletter === 'true';

      // Append to Buy Meat sheet
      await appendToBuyMeatSheet({
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        product: sanitizedProduct,
        referralSource: sanitizedReferralSource,
        subscribedToNewsletter: isSubscribed,
        comments: sanitizedComments,
      });

      res.json({
        success: true,
        message: 'Successfully recorded buy meat inquiry',
      });

    } catch (error) {
      console.error('Error in buyMeatSubmit:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record buy meat inquiry. Please try again.',
      });
    }
  }
);

/**
 * Cloud Function: getEvents
 * Retrieves all events from Google Sheets
 */
export const getEvents = onRequest(
  {
    cors: false, // We'll handle CORS manually for better security
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({
        success: false,
        error: 'Origin not allowed',
      });
      return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      res.status(405).json({
        success: false,
        error: 'Method not allowed. Use GET.',
      });
      return;
    }

    // Rate limiting: 30 requests per minute per IP (higher for read operations)
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    try {
      const sheets = await getGoogleSheetsClient();

      // Read all events from the Events sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Events!A2:E', // Skip header row, columns: ID, Name, Date, Time, Type
      });

      const rows = response.data.values || [];
      const events = rows.map((row) => ({
        id: parseInt(row[0]) || 0,
        name: sanitizeString(row[1] || '', 200),
        date: sanitizeString(row[2] || '', 50),
        time: sanitizeString(row[3] || '', 50),
        type: sanitizeString(row[4] || '', 100),
      }));

      res.json({
        success: true,
        events,
      });

    } catch (error) {
      console.error('Error in getEvents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve events. Please try again.',
        events: [],
      });
    }
  }
);

/**
 * Cloud Function: addEvent
 * Adds a new event to Google Sheets (Admin only)
 */
export const addEvent = onRequest(
  {
    cors: false, // We'll handle CORS manually for better security
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, adminPassword],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({
        success: false,
        error: 'Origin not allowed',
      });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.',
      });
      return;
    }

    // Rate limiting: 10 requests per minute per IP
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    try {
      const { password, name, date, time, type } = req.body;

      // Validate admin password
      if (!password || typeof password !== 'string') {
        res.status(401).json({
          success: false,
          error: 'Admin password is required',
        });
        return;
      }

      if (!validateAdminPassword(password, adminPassword.value())) {
        res.status(401).json({
          success: false,
          error: 'Invalid admin password',
        });
        return;
      }

      // Validate required fields
      if (!name || typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ success: false, error: 'Event name is required' });
        return;
      }

      if (!date || typeof date !== 'string' || date.trim() === '') {
        res.status(400).json({ success: false, error: 'Event date is required' });
        return;
      }

      if (!time || typeof time !== 'string' || time.trim() === '') {
        res.status(400).json({ success: false, error: 'Event time is required' });
        return;
      }

      if (!type || typeof type !== 'string' || type.trim() === '') {
        res.status(400).json({ success: false, error: 'Event type is required' });
        return;
      }

      // Sanitize inputs
      const sanitizedName = sanitizeString(name, 200);
      const sanitizedDate = sanitizeString(date, 50);
      const sanitizedTime = sanitizeString(time, 50);
      const sanitizedType = sanitizeString(type, 100);

      if (sanitizedName.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid event name',
        });
        return;
      }

      const sheets = await getGoogleSheetsClient();

      // Get current events to determine next ID
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Events!A2:A',
      });

      const existingIds = (getResponse.data.values || []).map(row => parseInt(row[0]) || 0);
      const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

      // Append new event
      const values = [[nextId, sanitizedName, sanitizedDate, sanitizedTime, sanitizedType]];

      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Events!A:E',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values },
      });

      console.log('Successfully added event:', {
        spreadsheetId: SPREADSHEET_ID,
        updatedRange: appendResponse.data.updates.updatedRange,
        updatedRows: appendResponse.data.updates.updatedRows,
      });

      res.json({
        success: true,
        message: 'Successfully added event',
        event: {
          id: nextId,
          name: sanitizedName,
          date: sanitizedDate,
          time: sanitizedTime,
          type: sanitizedType,
        },
      });

    } catch (error) {
      console.error('Error in addEvent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add event. Please try again.',
      });
    }
  }
);

/**
 * Cloud Function: deleteEvent
 * Deletes an event from Google Sheets by ID (Admin only)
 */
export const deleteEvent = onRequest(
  {
    cors: false, // We'll handle CORS manually for better security
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, adminPassword],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({
        success: false,
        error: 'Origin not allowed',
      });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST.',
      });
      return;
    }

    // Rate limiting: 10 requests per minute per IP
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    try {
      const { password, id } = req.body;

      // Validate admin password
      if (!password || typeof password !== 'string') {
        res.status(401).json({
          success: false,
          error: 'Admin password is required',
        });
        return;
      }

      if (!validateAdminPassword(password, adminPassword.value())) {
        res.status(401).json({
          success: false,
          error: 'Invalid admin password',
        });
        return;
      }

      // Validate required fields
      if (!id || typeof id !== 'number') {
        res.status(400).json({ success: false, error: 'Event ID is required' });
        return;
      }

      const sheets = await getGoogleSheetsClient();

      // Get spreadsheet metadata to find the Events sheet ID
      const spreadsheetMetadata = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });

      const eventsSheet = spreadsheetMetadata.data.sheets.find(
        sheet => sheet.properties.title === 'Events'
      );

      if (!eventsSheet) {
        res.status(500).json({
          success: false,
          error: 'Events sheet not found in spreadsheet',
        });
        return;
      }

      const eventsSheetId = eventsSheet.properties.sheetId;

      // Get all events to find the row number
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Events!A2:E',
      });

      const rows = getResponse.data.values || [];
      const rowIndex = rows.findIndex(row => parseInt(row[0]) === id);

      if (rowIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Event not found',
        });
        return;
      }

      // Delete the row (rowIndex + 2 because we start at row 2, and index is 0-based)
      const actualRowNumber = rowIndex + 2;

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: eventsSheetId,
                  dimension: 'ROWS',
                  startIndex: actualRowNumber - 1,
                  endIndex: actualRowNumber,
                },
              },
            },
          ],
        },
      });

      console.log('Successfully deleted event:', { id, rowNumber: actualRowNumber });

      res.json({
        success: true,
        message: 'Successfully deleted event',
      });

    } catch (error) {
      console.error('Error in deleteEvent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete event. Please try again.',
      });
    }
  }
);

// ========================================
// STORE FUNCTIONS - Products, Books, Orders
// ========================================

/**
 * Cloud Function: getProducts
 * Retrieves all active products (meats and merchandise) from Google Sheets
 */
export const getProducts = onRequest(
  {
    cors: false,
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({ success: false, error: 'Origin not allowed' });
      return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' });
      return;
    }

    // Rate limiting: 30 requests per minute per IP
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
      return;
    }

    try {
      const sheets = await getGoogleSheetsClient();

      // Read all products from the Products sheet
      // Columns: ID, Category, Name, Description, Price, Quantity, Unit, ImageURL, Active
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Products!A2:I',
      });

      const rows = response.data.values || [];
      const products = rows
        .filter(row => row[8] === 'TRUE') // Only active products
        .map((row) => ({
          id: parseInt(row[0]) || 0,
          category: sanitizeString(row[1] || '', 50),
          name: sanitizeString(row[2] || '', 200),
          description: sanitizeString(row[3] || '', 500),
          price: parseFloat(row[4]) || 0,
          quantity: parseFloat(row[5]) || 0,
          unit: sanitizeString(row[6] || '', 20),
          imageUrl: sanitizeString(row[7] || '', 500),
        }));

      res.json({
        success: true,
        products,
      });

    } catch (error) {
      console.error('Error in getProducts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve products.',
        products: [],
      });
    }
  }
);

/**
 * Cloud Function: getBooks
 * Retrieves all active books from Google Sheets
 */
export const getBooks = onRequest(
  {
    cors: false,
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({ success: false, error: 'Origin not allowed' });
      return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' });
      return;
    }

    // Rate limiting: 30 requests per minute per IP
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
      return;
    }

    try {
      const sheets = await getGoogleSheetsClient();

      // Read all books from the Books sheet
      // Columns: ID, Title, Author, ExternalURL, ImageURL, Active
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Books!A2:F',
      });

      const rows = response.data.values || [];
      const books = rows
        .filter(row => row[5] === 'TRUE') // Only active books
        .map((row) => ({
          id: parseInt(row[0]) || 0,
          title: sanitizeString(row[1] || '', 200),
          author: sanitizeString(row[2] || '', 200),
          externalUrl: sanitizeString(row[3] || '', 500),
          imageUrl: sanitizeString(row[4] || '', 500),
        }));

      res.json({
        success: true,
        books,
      });

    } catch (error) {
      console.error('Error in getBooks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve books.',
        books: [],
      });
    }
  }
);

/**
 * Cloud Function: addProduct
 * Adds a new product (meat or merchandise) to Google Sheets (Admin only)
 */
export const addProduct = onRequest(
  {
    cors: false,
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, adminPassword],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({ success: false, error: 'Origin not allowed' });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
      return;
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
      return;
    }

    try {
      const { password, category, name, description, price, quantity, unit, imageUrl } = req.body;

      // Validate admin password
      if (!password || !validateAdminPassword(password, adminPassword.value())) {
        res.status(401).json({ success: false, error: 'Invalid admin password' });
        return;
      }

      // Validate required fields
      if (!category || !['meat', 'merchandise'].includes(category)) {
        res.status(400).json({ success: false, error: 'Category must be "meat" or "merchandise"' });
        return;
      }

      if (!name || typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ success: false, error: 'Product name is required' });
        return;
      }

      if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        res.status(400).json({ success: false, error: 'Valid price is required' });
        return;
      }

      if (quantity === undefined || isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) {
        res.status(400).json({ success: false, error: 'Valid quantity is required' });
        return;
      }

      // Sanitize inputs
      const sanitizedCategory = sanitizeString(category, 50);
      const sanitizedName = sanitizeString(name, 200);
      const sanitizedDescription = description ? sanitizeString(description, 500) : '';
      const sanitizedPrice = parseFloat(price);
      const sanitizedQuantity = parseFloat(quantity);
      const sanitizedUnit = unit ? sanitizeString(unit, 20) : (category === 'meat' ? 'lb' : 'item');
      const sanitizedImageUrl = imageUrl ? sanitizeString(imageUrl, 500) : '';

      const sheets = await getGoogleSheetsClient();

      // Get current products to determine next ID
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Products!A2:A',
      });

      const existingIds = (getResponse.data.values || []).map(row => parseInt(row[0]) || 0);
      const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

      // Append new product
      const values = [[
        nextId,
        sanitizedCategory,
        sanitizedName,
        sanitizedDescription,
        sanitizedPrice,
        sanitizedQuantity,
        sanitizedUnit,
        sanitizedImageUrl,
        'TRUE', // Active
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Products!A:I',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values },
      });

      console.log('Successfully added product:', { id: nextId, name: sanitizedName });

      res.json({
        success: true,
        message: 'Successfully added product',
        product: {
          id: nextId,
          category: sanitizedCategory,
          name: sanitizedName,
          description: sanitizedDescription,
          price: sanitizedPrice,
          quantity: sanitizedQuantity,
          unit: sanitizedUnit,
          imageUrl: sanitizedImageUrl,
        },
      });

    } catch (error) {
      console.error('Error in addProduct:', error);
      res.status(500).json({ success: false, error: 'Failed to add product. Please try again.' });
    }
  }
);

/**
 * Cloud Function: updateProduct
 * Updates an existing product in Google Sheets (Admin only)
 */
export const updateProduct = onRequest(
  {
    cors: false,
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, adminPassword],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({ success: false, error: 'Origin not allowed' });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
      return;
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
      return;
    }

    try {
      const { password, id, name, description, price, quantity, unit, imageUrl } = req.body;

      // Validate admin password
      if (!password || !validateAdminPassword(password, adminPassword.value())) {
        res.status(401).json({ success: false, error: 'Invalid admin password' });
        return;
      }

      // Validate ID
      if (!id || typeof id !== 'number') {
        res.status(400).json({ success: false, error: 'Product ID is required' });
        return;
      }

      const sheets = await getGoogleSheetsClient();

      // Get all products to find the row
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Products!A2:I',
      });

      const rows = getResponse.data.values || [];
      const rowIndex = rows.findIndex(row => parseInt(row[0]) === id);

      if (rowIndex === -1) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }

      const actualRowNumber = rowIndex + 2;
      const currentRow = rows[rowIndex];

      // Build updated row with current values as fallback
      const updatedValues = [[
        id,
        currentRow[1], // category stays the same
        name !== undefined ? sanitizeString(name, 200) : currentRow[2],
        description !== undefined ? sanitizeString(description, 500) : currentRow[3],
        price !== undefined ? parseFloat(price) : currentRow[4],
        quantity !== undefined ? parseFloat(quantity) : currentRow[5],
        unit !== undefined ? sanitizeString(unit, 20) : currentRow[6],
        imageUrl !== undefined ? sanitizeString(imageUrl, 500) : currentRow[7],
        currentRow[8], // active stays the same
      ]];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Products!A${actualRowNumber}:I${actualRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: updatedValues },
      });

      console.log('Successfully updated product:', { id });

      res.json({
        success: true,
        message: 'Successfully updated product',
        product: {
          id: updatedValues[0][0],
          category: updatedValues[0][1],
          name: updatedValues[0][2],
          description: updatedValues[0][3],
          price: updatedValues[0][4],
          quantity: updatedValues[0][5],
          unit: updatedValues[0][6],
          imageUrl: updatedValues[0][7],
        },
      });

    } catch (error) {
      console.error('Error in updateProduct:', error);
      res.status(500).json({ success: false, error: 'Failed to update product. Please try again.' });
    }
  }
);

/**
 * Cloud Function: deleteProduct
 * Deactivates a product in Google Sheets (Admin only)
 */
export const deleteProduct = onRequest(
  {
    cors: false,
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, adminPassword],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({ success: false, error: 'Origin not allowed' });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
      return;
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
      return;
    }

    try {
      const { password, id } = req.body;

      // Validate admin password
      if (!password || !validateAdminPassword(password, adminPassword.value())) {
        res.status(401).json({ success: false, error: 'Invalid admin password' });
        return;
      }

      // Validate ID
      if (!id || typeof id !== 'number') {
        res.status(400).json({ success: false, error: 'Product ID is required' });
        return;
      }

      const sheets = await getGoogleSheetsClient();

      // Get all products to find the row
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Products!A2:I',
      });

      const rows = getResponse.data.values || [];
      const rowIndex = rows.findIndex(row => parseInt(row[0]) === id);

      if (rowIndex === -1) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }

      const actualRowNumber = rowIndex + 2;

      // Set Active to FALSE instead of deleting
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Products!I${actualRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [['FALSE']] },
      });

      console.log('Successfully deactivated product:', { id });

      res.json({
        success: true,
        message: 'Successfully deleted product',
      });

    } catch (error) {
      console.error('Error in deleteProduct:', error);
      res.status(500).json({ success: false, error: 'Failed to delete product. Please try again.' });
    }
  }
);

/**
 * Cloud Function: addBook
 * Adds a new book to Google Sheets (Admin only)
 */
export const addBook = onRequest(
  {
    cors: false,
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, adminPassword],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({ success: false, error: 'Origin not allowed' });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
      return;
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
      return;
    }

    try {
      const { password, title, author, externalUrl, imageUrl } = req.body;

      // Validate admin password
      if (!password || !validateAdminPassword(password, adminPassword.value())) {
        res.status(401).json({ success: false, error: 'Invalid admin password' });
        return;
      }

      // Validate required fields
      if (!title || typeof title !== 'string' || title.trim() === '') {
        res.status(400).json({ success: false, error: 'Book title is required' });
        return;
      }

      if (!author || typeof author !== 'string' || author.trim() === '') {
        res.status(400).json({ success: false, error: 'Author is required' });
        return;
      }

      if (!externalUrl || typeof externalUrl !== 'string' || externalUrl.trim() === '') {
        res.status(400).json({ success: false, error: 'External URL is required' });
        return;
      }

      // Sanitize inputs
      const sanitizedTitle = sanitizeString(title, 200);
      const sanitizedAuthor = sanitizeString(author, 200);
      const sanitizedExternalUrl = sanitizeString(externalUrl, 500);
      const sanitizedImageUrl = imageUrl ? sanitizeString(imageUrl, 500) : '';

      const sheets = await getGoogleSheetsClient();

      // Get current books to determine next ID
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Books!A2:A',
      });

      const existingIds = (getResponse.data.values || []).map(row => parseInt(row[0]) || 0);
      const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

      // Append new book
      const values = [[
        nextId,
        sanitizedTitle,
        sanitizedAuthor,
        sanitizedExternalUrl,
        sanitizedImageUrl,
        'TRUE', // Active
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Books!A:F',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values },
      });

      console.log('Successfully added book:', { id: nextId, title: sanitizedTitle });

      res.json({
        success: true,
        message: 'Successfully added book',
        book: {
          id: nextId,
          title: sanitizedTitle,
          author: sanitizedAuthor,
          externalUrl: sanitizedExternalUrl,
          imageUrl: sanitizedImageUrl,
        },
      });

    } catch (error) {
      console.error('Error in addBook:', error);
      res.status(500).json({ success: false, error: 'Failed to add book. Please try again.' });
    }
  }
);

/**
 * Cloud Function: updateBook
 * Updates an existing book in Google Sheets (Admin only)
 */
export const updateBook = onRequest(
  {
    cors: false,
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, adminPassword],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({ success: false, error: 'Origin not allowed' });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
      return;
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
      return;
    }

    try {
      const { password, id, title, author, externalUrl, imageUrl } = req.body;

      // Validate admin password
      if (!password || !validateAdminPassword(password, adminPassword.value())) {
        res.status(401).json({ success: false, error: 'Invalid admin password' });
        return;
      }

      // Validate ID
      if (!id || typeof id !== 'number') {
        res.status(400).json({ success: false, error: 'Book ID is required' });
        return;
      }

      const sheets = await getGoogleSheetsClient();

      // Get all books to find the row
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Books!A2:F',
      });

      const rows = getResponse.data.values || [];
      const rowIndex = rows.findIndex(row => parseInt(row[0]) === id);

      if (rowIndex === -1) {
        res.status(404).json({ success: false, error: 'Book not found' });
        return;
      }

      const actualRowNumber = rowIndex + 2;
      const currentRow = rows[rowIndex];

      // Build updated row
      const updatedValues = [[
        id,
        title !== undefined ? sanitizeString(title, 200) : currentRow[1],
        author !== undefined ? sanitizeString(author, 200) : currentRow[2],
        externalUrl !== undefined ? sanitizeString(externalUrl, 500) : currentRow[3],
        imageUrl !== undefined ? sanitizeString(imageUrl, 500) : currentRow[4],
        currentRow[5], // active stays the same
      ]];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Books!A${actualRowNumber}:F${actualRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: updatedValues },
      });

      console.log('Successfully updated book:', { id });

      res.json({
        success: true,
        message: 'Successfully updated book',
        book: {
          id: updatedValues[0][0],
          title: updatedValues[0][1],
          author: updatedValues[0][2],
          externalUrl: updatedValues[0][3],
          imageUrl: updatedValues[0][4],
        },
      });

    } catch (error) {
      console.error('Error in updateBook:', error);
      res.status(500).json({ success: false, error: 'Failed to update book. Please try again.' });
    }
  }
);

/**
 * Cloud Function: deleteBook
 * Deactivates a book in Google Sheets (Admin only)
 */
export const deleteBook = onRequest(
  {
    cors: false,
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, adminPassword],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({ success: false, error: 'Origin not allowed' });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
      return;
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
      return;
    }

    try {
      const { password, id } = req.body;

      // Validate admin password
      if (!password || !validateAdminPassword(password, adminPassword.value())) {
        res.status(401).json({ success: false, error: 'Invalid admin password' });
        return;
      }

      // Validate ID
      if (!id || typeof id !== 'number') {
        res.status(400).json({ success: false, error: 'Book ID is required' });
        return;
      }

      const sheets = await getGoogleSheetsClient();

      // Get all books to find the row
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Books!A2:F',
      });

      const rows = getResponse.data.values || [];
      const rowIndex = rows.findIndex(row => parseInt(row[0]) === id);

      if (rowIndex === -1) {
        res.status(404).json({ success: false, error: 'Book not found' });
        return;
      }

      const actualRowNumber = rowIndex + 2;

      // Set Active to FALSE
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Books!F${actualRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [['FALSE']] },
      });

      console.log('Successfully deactivated book:', { id });

      res.json({
        success: true,
        message: 'Successfully deleted book',
      });

    } catch (error) {
      console.error('Error in deleteBook:', error);
      res.status(500).json({ success: false, error: 'Failed to delete book. Please try again.' });
    }
  }
);

/**
 * Cloud Function: submitOrder
 * Submits an order and decrements product inventory
 */
export const submitOrder = onRequest(
  {
    cors: false,
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, recaptchaSecretKey],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({ success: false, error: 'Origin not allowed' });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
      return;
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 10, 60000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
      return;
    }

    try {
      const {
        firstName, lastName, email, phone,
        address, city, state, zip,
        productId, quantity,
        recaptchaToken,
      } = req.body;

      // Verify reCAPTCHA
      const recaptchaResult = await verifyRecaptcha(
        recaptchaToken,
        recaptchaSecretKey.value(),
        'order_submit',
        0.5
      );

      if (!recaptchaResult.success) {
        res.status(400).json({ success: false, error: 'Bot detection failed. Please try again.' });
        return;
      }

      // Validate required fields
      if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
        res.status(400).json({ success: false, error: 'First name is required' });
        return;
      }

      if (!lastName || typeof lastName !== 'string' || lastName.trim() === '') {
        res.status(400).json({ success: false, error: 'Last name is required' });
        return;
      }

      if (!email || !isValidEmail(email.trim())) {
        res.status(400).json({ success: false, error: 'Valid email is required' });
        return;
      }

      if (!phone || !isValidPhone(phone.trim())) {
        res.status(400).json({ success: false, error: 'Valid phone is required' });
        return;
      }

      if (!address || typeof address !== 'string' || address.trim() === '') {
        res.status(400).json({ success: false, error: 'Address is required' });
        return;
      }

      if (!city || typeof city !== 'string' || city.trim() === '') {
        res.status(400).json({ success: false, error: 'City is required' });
        return;
      }

      if (!state || typeof state !== 'string' || state.trim() === '') {
        res.status(400).json({ success: false, error: 'State is required' });
        return;
      }

      if (!zip || typeof zip !== 'string' || zip.trim() === '') {
        res.status(400).json({ success: false, error: 'ZIP code is required' });
        return;
      }

      if (!productId || typeof productId !== 'number') {
        res.status(400).json({ success: false, error: 'Product ID is required' });
        return;
      }

      if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({ success: false, error: 'Valid quantity is required' });
        return;
      }

      const sheets = await getGoogleSheetsClient();

      // Get product to verify availability
      const productResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Products!A2:I',
      });

      const products = productResponse.data.values || [];
      const productRowIndex = products.findIndex(row => parseInt(row[0]) === productId);

      if (productRowIndex === -1) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }

      const product = products[productRowIndex];
      const availableQty = parseFloat(product[5]) || 0;

      if (quantity > availableQty) {
        res.status(400).json({
          success: false,
          error: `Insufficient inventory. Only ${availableQty} available.`,
        });
        return;
      }

      // Calculate order total
      const pricePerUnit = parseFloat(product[4]) || 0;
      const total = pricePerUnit * quantity;

      // Get next order ID
      const orderResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Orders!A2:A',
      });

      const existingOrderIds = (orderResponse.data.values || []).map(row => parseInt(row[0]) || 0);
      const nextOrderId = existingOrderIds.length > 0 ? Math.max(...existingOrderIds) + 1 : 1;

      const { date, time } = getFormattedDateTime();

      // Sanitize inputs
      const sanitizedFirstName = sanitizeString(firstName, 100);
      const sanitizedLastName = sanitizeString(lastName, 100);
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedPhone = phone.trim();
      const sanitizedAddress = sanitizeString(address, 200);
      const sanitizedCity = sanitizeString(city, 100);
      const sanitizedState = sanitizeString(state, 50);
      const sanitizedZip = sanitizeString(zip, 20);

      // Append order
      const orderValues = [[
        nextOrderId,
        date,
        time,
        sanitizedFirstName,
        sanitizedLastName,
        sanitizedEmail,
        sanitizedPhone,
        sanitizedAddress,
        sanitizedCity,
        sanitizedState,
        sanitizedZip,
        productId,
        product[2], // Product name
        quantity,
        pricePerUnit,
        total,
        'pending',
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Orders!A:Q',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: orderValues },
      });

      // Decrement inventory
      const newQuantity = availableQty - quantity;
      const productRowNumber = productRowIndex + 2;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Products!F${productRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[newQuantity]] },
      });

      console.log('Successfully submitted order:', { orderId: nextOrderId, productId, quantity });

      res.json({
        success: true,
        message: 'Order submitted successfully!',
        orderId: nextOrderId,
        total: total.toFixed(2),
      });

    } catch (error) {
      console.error('Error in submitOrder:', error);
      res.status(500).json({ success: false, error: 'Failed to submit order. Please try again.' });
    }
  }
);

/**
 * Cloud Function: getOrders
 * Retrieves all orders from Google Sheets (Admin only)
 */
export const getOrders = onRequest(
  {
    cors: false,
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: [googleServiceAccountKey, adminPassword],
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (applyCORS(req, res, ALLOWED_ORIGINS)) {
        res.status(204).send('');
      } else {
        res.status(403).send('Origin not allowed');
      }
      return;
    }

    // Apply CORS for actual request
    if (!applyCORS(req, res, ALLOWED_ORIGINS)) {
      res.status(403).json({ success: false, error: 'Origin not allowed' });
      return;
    }

    // Only allow POST requests (to include password)
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
      return;
    }

    // Rate limiting
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP, 30, 60000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
      return;
    }

    try {
      const { password } = req.body;

      // Validate admin password
      if (!password || !validateAdminPassword(password, adminPassword.value())) {
        res.status(401).json({ success: false, error: 'Invalid admin password' });
        return;
      }

      const sheets = await getGoogleSheetsClient();

      // Read all orders
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Orders!A2:Q',
      });

      const rows = response.data.values || [];
      const orders = rows.map((row) => ({
        id: parseInt(row[0]) || 0,
        date: sanitizeString(row[1] || '', 50),
        time: sanitizeString(row[2] || '', 50),
        firstName: sanitizeString(row[3] || '', 100),
        lastName: sanitizeString(row[4] || '', 100),
        email: sanitizeString(row[5] || '', 200),
        phone: sanitizeString(row[6] || '', 50),
        address: sanitizeString(row[7] || '', 200),
        city: sanitizeString(row[8] || '', 100),
        state: sanitizeString(row[9] || '', 50),
        zip: sanitizeString(row[10] || '', 20),
        productId: parseInt(row[11]) || 0,
        productName: sanitizeString(row[12] || '', 200),
        quantity: parseFloat(row[13]) || 0,
        pricePerUnit: parseFloat(row[14]) || 0,
        total: parseFloat(row[15]) || 0,
        status: sanitizeString(row[16] || 'pending', 50),
      }));

      // Sort by most recent first
      orders.reverse();

      res.json({
        success: true,
        orders,
      });

    } catch (error) {
      console.error('Error in getOrders:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve orders.',
        orders: [],
      });
    }
  }
);
