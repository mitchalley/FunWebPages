# Second Date Invite

A small webapp for sending a playful second-date question, collecting a date
idea and time, then emailing the response.

## Run It

```powershell
npm start
```

Open `http://localhost:4173`.

## Email Setup

The app sends email from the server through Resend's email API. Set these
environment variables before running or deploying:

```powershell
$env:RESEND_API_KEY="re_your_api_key_here"
$env:TO_EMAIL="you@example.com"
$env:FROM_EMAIL="Second Date <dates@yourdomain.com>"
$env:REPLY_TO_EMAIL="you@example.com"
npm start
```

If those values are not set, submissions still work in preview mode and the
server logs the response instead of emailing it.
