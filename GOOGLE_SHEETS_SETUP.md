# Google Sheets API Setup Guide

This guide walks you through setting up the Google Sheets API integration for the Homecoming Ranch email capture form.

## Overview

When users submit the recipe book email capture form, their information is automatically appended to a Google Sheet with the following columns:

- **Date** - Submission date (America/New_York timezone)
- **Time** - Submission time (America/New_York timezone)
- **First Name** - User's first name
- **Last Name** - User's last name
- **Subscribed to Newsletter** - TRUE or FALSE

## Prerequisites

- Google account with access to Google Cloud Console
- The spreadsheet URL: `https://docs.google.com/spreadsheets/d/1Ikt5YbB675yHYj7m0An0AwPeahg9D_GkIPNP2ViCzqQ/edit?gid=0#gid=0`

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name (e.g., "Homecoming Ranch")
4. Click **Create**
5. Wait for the project to be created, then select it

## Step 2: Enable Google Sheets API

1. In your Google Cloud project, go to **APIs & Services** → **Library**
2. Search for "Google Sheets API"
3. Click on **Google Sheets API**
4. Click **Enable**
5. Wait for the API to be enabled

## Step 3: Create a Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in the service account details:
   - **Service account name**: `homecoming-ranch-sheets` (or any name you prefer)
   - **Service account ID**: Will auto-generate
   - **Description**: "Service account for Google Sheets API access"
4. Click **Create and Continue**
5. Skip the optional steps (Grant access & Grant users access)
6. Click **Done**

## Step 4: Create and Download Service Account Key

1. On the **Credentials** page, find your newly created service account
2. Click on the service account email to open details
3. Go to the **Keys** tab
4. Click **Add Key** → **Create new key**
5. Select **JSON** as the key type
6. Click **Create**
7. The JSON key file will automatically download to your computer
8. **IMPORTANT**: Keep this file secure and never commit it to version control

## Step 5: Share Google Sheet with Service Account

1. Open the JSON key file you just downloaded
2. Copy the `client_email` value (looks like: `homecoming-ranch-sheets@your-project.iam.gserviceaccount.com`)
3. Open your Google Sheet: [https://docs.google.com/spreadsheets/d/1Ikt5YbB675yHYj7m0An0AwPeahg9D_GkIPNP2ViCzqQ/edit](https://docs.google.com/spreadsheets/d/1Ikt5YbB675yHYj7m0An0AwPeahg9D_GkIPNP2ViCzqQ/edit)
4. Click the **Share** button
5. Paste the service account email
6. Set permission to **Editor**
7. Uncheck **Notify people**
8. Click **Share**

## Step 6: Set Up Sheet Headers (If Not Already Set)

Make sure your Google Sheet has the following headers in row 1:

| A    | B    | C          | D         | E                          |
|------|------|------------|-----------|----------------------------|
| Date | Time | First Name | Last Name | Subscribed to Newsletter  |

## Step 7: Configure Environment Variables

1. In your project directory, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file in a text editor

3. Update the following variables:

   ```env
   PORT=3001
   GOOGLE_SHEET_ID=1Ikt5YbB675yHYj7m0An0AwPeahg9D_GkIPNP2ViCzqQ
   SHEET_NAME=Sheet1
   ```

4. For `GOOGLE_SERVICE_ACCOUNT_KEY`, you need to convert the downloaded JSON file to a single-line string:

   **Option A - Manual (Recommended):**
   - Open the downloaded JSON key file
   - Copy the entire contents
   - Remove all newlines and extra spaces to make it a single line
   - Paste it as the value for `GOOGLE_SERVICE_ACCOUNT_KEY`

   **Option B - Using Command Line:**
   ```bash
   cat /path/to/your-service-account-key.json | tr -d '\n' | tr -s ' '
   ```

   Your `.env` file should look like:
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"homecoming-ranch-sheets@your-project.iam.gserviceaccount.com"...}
   ```

5. Save the `.env` file

6. **NEVER commit the `.env` file to version control** (already excluded in `.gitignore`)

## Step 8: Test the Integration

Run the test script to verify everything is set up correctly:

```bash
npm run test:sheets
```

This will:
1. ✅ Check environment variables
2. ✅ Parse service account credentials
3. ✅ Initialize Google Auth
4. ✅ Test read access to the spreadsheet
5. ✅ Test write access by appending a test row

If successful, you'll see a test entry in your Google Sheet with "Test User" data.

## Step 9: Start the Server

```bash
npm run server
```

Or for development with auto-restart:

```bash
npm run server:dev
```

The server will start on `http://localhost:3001`

## Step 10: Test the API Endpoints

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Test Google Sheets Connection
```bash
curl http://localhost:3001/api/test-sheets
```

### Test Recipe Signup (POST)
```bash
curl -X POST http://localhost:3001/api/recipe-signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "subscribedToNewsletter": true
  }'
```

## API Endpoints

### `POST /api/recipe-signup`

Handles recipe book email capture form submission.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "subscribedToNewsletter": true
}
```

**Validation:**
- `firstName` (required): Non-empty string
- `lastName` (required): Non-empty string
- `subscribedToNewsletter` (optional): Boolean, defaults to `false`

**Success Response:**
```json
{
  "success": true,
  "message": "Successfully recorded signup"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

### `GET /api/health`

Health check endpoint to verify server is running.

### `GET /api/test-sheets`

Test endpoint to verify Google Sheets connection and permissions.

## Troubleshooting

### Error: "Failed to initialize Google Sheets API"
- Verify your `.env` file exists and has `GOOGLE_SERVICE_ACCOUNT_KEY` set
- Make sure the JSON is valid (use a JSON validator)
- Check that all quotes and special characters are properly escaped

### Error: "The caller does not have permission"
- Ensure you shared the spreadsheet with the service account email
- The service account needs **Editor** permissions
- Double-check the `client_email` from your JSON key file

### Error: "Unable to parse range"
- Verify the `SHEET_NAME` in `.env` matches your actual sheet name
- Default is "Sheet1" - update if your sheet has a different name

### Test row appears but API calls fail
- Check CORS configuration in `server.js`
- Verify the server is running on the correct port
- Check network/firewall settings

### Credentials not loading
- Ensure `.env` file is in the project root directory
- Verify the file is named exactly `.env` (not `.env.txt`)
- Check that `dotenv` is installed: `npm list dotenv`

## Security Best Practices

1. ✅ Never commit `.env` file or service account JSON to git
2. ✅ Use environment variables for all sensitive data
3. ✅ Limit service account permissions to only what's needed
4. ✅ Regularly rotate service account keys
5. ✅ Monitor Google Cloud audit logs for suspicious activity
6. ✅ Use HTTPS in production
7. ✅ Implement rate limiting on API endpoints

## Production Deployment

When deploying to production:

1. Set environment variables in your hosting platform (Vercel, Heroku, etc.)
2. Do NOT include `.env` file in deployment
3. Enable HTTPS
4. Configure CORS to allow only your production domain
5. Add rate limiting middleware
6. Set up error monitoring (e.g., Sentry)
7. Enable API request logging

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Test the integration with the test script
3. ✅ Verify data appears correctly in Google Sheet
4. Update your frontend form to call the `/api/recipe-signup` endpoint
5. Test the full flow from frontend to Google Sheets
6. Deploy to production

## Support

If you encounter issues:
1. Review this setup guide carefully
2. Check the troubleshooting section
3. Review error logs in the terminal
4. Verify all environment variables are set correctly
5. Test with the `test-sheets.js` script first
