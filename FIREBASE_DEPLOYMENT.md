# Firebase Deployment Guide - Homecoming Ranch

This guide explains how to deploy your Homecoming Ranch website with Firebase Cloud Functions.

## Architecture Overview

Your app now uses:
- **Firebase Hosting** - Serves your React frontend (static files)
- **Firebase Cloud Functions** - Runs your backend API (Google Sheets integration)

When deployed, API calls to `/api/recipe-signup` are automatically routed to your Cloud Function.

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Logged into Firebase: `firebase login`
- Your Google Service Account credentials (from `.env` file)

## Step 1: Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

## Step 2: Set Environment Variables for Cloud Functions

You need to set your Google Service Account credentials as a Cloud Function environment variable.

### Get Your Credentials JSON

Open your `.env` file and copy the value of `GOOGLE_SERVICE_ACCOUNT_KEY` (the entire JSON string).

### Set the Environment Variable

Run this command (replace `YOUR_JSON_HERE` with your actual JSON from `.env`):

```bash
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_KEY
```

When prompted, paste your entire Google Service Account JSON.

**Example:**
```bash
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_KEY
# Paste: {"type":"service_account","project_id":"..."}
```

## Step 3: Build Your Frontend

```bash
npm run build
```

This creates the production build in the `/dist` folder.

## Step 4: Deploy to Firebase

### Deploy Everything (Frontend + Backend)

```bash
firebase deploy
```

### Or Deploy Separately

**Frontend only:**
```bash
firebase deploy --only hosting
```

**Backend only:**
```bash
firebase deploy --only functions
```

## Step 5: Test Your Deployment

After deployment succeeds, you'll see your URLs:

```
Hosting URL: https://homecoming-ranch-1c2d9.web.app
Function URL: https://us-central1-homecoming-ranch-1c2d9.cloudfunctions.net/recipeSignup
```

### Test the Cloud Function

```bash
curl -X POST https://us-central1-homecoming-ranch-1c2d9.cloudfunctions.net/recipeSignup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "email": "test@example.com",
    "subscribedToNewsletter": true
  }'
```

### Test via Website

1. Visit your Hosting URL: `https://homecoming-ranch-1c2d9.web.app`
2. Fill out the recipe book form
3. Submit
4. Check your Google Sheet for the new entry

## Local Development with Firebase Emulators

To test Cloud Functions locally before deploying:

### 1. Start Firebase Emulators

```bash
firebase emulators:start
```

This starts:
- Functions emulator on `http://localhost:5001`
- Hosting emulator on `http://localhost:5000`

### 2. Set Local Environment Variables

Create `functions/.env.local`:

```bash
cd functions
cp ../.env .env.local
# Edit .env.local and keep only GOOGLE_SERVICE_ACCOUNT_KEY
```

### 3. Test Locally

- **Frontend:** `http://localhost:5000` (served by Firebase)
- **Function:** `http://localhost:5001/homecoming-ranch-1c2d9/us-central1/recipeSignup`

Your frontend is already configured to use the local emulator URL when running in development mode.

## Alternative: Run Frontend & Backend Separately

If you prefer to develop with Vite's dev server and Firebase emulators:

**Terminal 1 - Firebase Emulators:**
```bash
firebase emulators:start --only functions
```

**Terminal 2 - Vite Dev Server:**
```bash
npm run dev
```

Your app will:
- Frontend: `http://localhost:5173` (Vite)
- Backend: `http://localhost:5001/homecoming-ranch-1c2d9/us-central1/recipeSignup` (Firebase Emulator)

## Viewing Logs

### Production Logs

```bash
firebase functions:log
```

### Real-time Logs

```bash
firebase functions:log --only recipeSignup
```

### View in Firebase Console

Visit: https://console.firebase.google.com/project/homecoming-ranch-1c2d9/functions

## Troubleshooting

### "GOOGLE_SERVICE_ACCOUNT_KEY is not defined"

Your environment variable isn't set. Run:

```bash
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT_KEY
```

### "Permission denied" when accessing Google Sheets

1. Check that the service account email has Editor access to your spreadsheet
2. Verify the credentials JSON is correct

### Function times out

- Cloud Functions have a 60-second timeout by default
- Check logs: `firebase functions:log`
- The Google Sheets API should respond quickly

### CORS errors in browser

The Cloud Function is configured with `cors: true` which allows all origins. If you still get CORS errors:

1. Check browser console for the exact error
2. Verify the function is deployed: `firebase functions:list`

### Build fails

Make sure you're in the project root when running `npm run build`, not in the `functions` directory.

## Cost Considerations

Firebase Cloud Functions pricing (as of 2026):

- **Free tier:** 2M invocations/month, 400K GB-seconds, 200K CPU-seconds
- Your function uses 256MB memory and typically completes in < 2 seconds
- With typical usage, you'll stay well within the free tier

Google Sheets API is free (60 requests per minute per project).

## Production Checklist

Before going live:

- [ ] Set `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable
- [ ] Build frontend: `npm run build`
- [ ] Test functions locally with emulators
- [ ] Deploy: `firebase deploy`
- [ ] Test on production URL
- [ ] Verify Google Sheet receives data
- [ ] Check Firebase logs for errors
- [ ] Set up monitoring/alerts in Firebase Console

## Continuous Deployment (Optional)

Set up GitHub Actions to auto-deploy on push to main:

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm ci
          cd functions && npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

Get your Firebase token:
```bash
firebase login:ci
```

Add the token to GitHub Secrets as `FIREBASE_TOKEN`.

## Support

- Firebase Docs: https://firebase.google.com/docs/functions
- Google Sheets API: https://developers.google.com/sheets/api

## Summary

**Local Development:**
```bash
# Option 1: Firebase emulators
firebase emulators:start

# Option 2: Separate dev servers
firebase emulators:start --only functions  # Terminal 1
npm run dev                                 # Terminal 2
```

**Production Deployment:**
```bash
npm run build
firebase deploy
```

That's it! Your frontend and backend deploy together with a single command.
