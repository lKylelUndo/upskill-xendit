# Xendit Setup and Vercel Integration Guide

This guide explains how to set up the Xendit invoice flow in this Next.js app, including the Vercel deployment path and webhook configuration.

## 1. Install dependencies

```bash
npm install
```

This repo already depends on `xendit-node`, so running `npm install` is enough to get the SDK and the app dependencies.

## 2. Create environment variables

Create a `.env` file in the project root with your Xendit keys and webhook token:

```env
XENDIT_SECRET_KEY=REPLACE_WITH_YOUR_XENDIT_SECRET_KEY
XENDIT_PUBLIC_KEY=REPLACE_WITH_YOUR_XENDIT_PUBLIC_KEY
WEBHOOK_VERIFICATION_TOKEN=REPLACE_WITH_A_RANDOM_SECRET
```

> Use the Xendit secret key, not the public key. For the demo flow, use a test secret key from the Xendit Dashboard.

## 3. Configure Xendit API key permissions

In the Xendit Dashboard:

1. Open **Developers** → **API Keys**.
2. Create a new secret key or select an existing one.
3. Grant the key permission for the **Invoice** API.
   - Do not use a key that only has Money-out / Disbursements permissions for this invoice flow.
4. If IP allowlisting is enabled, add the Vercel IP or your production server IP as needed.

### Why this matters

- The app uses the Xendit Invoice API.
- If the key is missing Invoice permission, Xendit returns `403 Forbidden`.
- If IP allowlist is enabled and the allowed IP is missing, the request will fail.

## 4. How the app is wired

### `lib/xendit.ts`

This file creates the Xendit SDK client using the secret key:

```ts
import { Xendit } from "xendit-node";

export const xenditClient = process.env.XENDIT_SECRET_KEY
  ? new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY })
  : null;
```

### `app/api/create-invoice/route.ts`

This API route:

- receives `amount` and `description` from the browser
- creates a Xendit invoice with `externalId`
- sets `successRedirectUrl`/`failureRedirectUrl` to `invoice-result` on your app
- returns the Xendit checkout URL and a status page link

### `app/api/invoice-status/route.ts`

This route fetches invoice status from Xendit:

- it accepts either `invoiceId` or `externalId`
- if the value starts with `demo-...`, it treats it as an `externalId`
- it returns the latest invoice object to the browser

### `app/api/xendit-webhook/route.ts`

This route receives webhook notifications from Xendit.

- Xendit sends server-to-server POST requests here
- If payment is `PAID`, you can update your database or app state
- the response is an acknowledgement sent back to Xendit

### `app/invoice-result/page.tsx`

This page shows the final payment result after the buyer is redirected back from Xendit.

- it reads `externalId` or `invoiceId` from the URL
- it calls `/api/invoice-status`
- it displays current invoice status and invoice details

## 5. Deploy to Vercel

To use webhooks and redirects without ngrok, deploy the app to Vercel.

1. Push your project to GitHub.
2. Connect the repo to Vercel.
3. Deploy the app.
4. In Vercel settings, add:
   - `XENDIT_SECRET_KEY`
   - `XENDIT_PUBLIC_KEY`
   - `WEBHOOK_VERIFICATION_TOKEN`

5. Use the Vercel app domain for your webhook and redirect URLs.

## 6. Configure Xendit Webhooks

In the Xendit Dashboard:

1. Open **Developers** → **Webhook Logs** (or the webhook settings page).
2. Set the webhook URL to:

```text
https://your-app.vercel.app/api/xendit-webhook
```

3. Make sure the webhook is enabled for `invoice.status` or invoice payment events.

## 7. How the payment flow works on Vercel

1. Browser requests `POST /api/create-invoice`.
2. Your backend creates a Xendit invoice with `externalId`.
3. Xendit returns a checkout URL.
4. User completes payment on the Xendit checkout page.
5. Xendit redirects the browser to:
   `https://your-app.vercel.app/invoice-result?externalId=demo-...`
6. Your page calls `/api/invoice-status` to fetch the latest status.
7. Xendit also sends a webhook to `/api/xendit-webhook` for server-side processing.

## 8. What your app should do with the response

- `app/api/create-invoice/route.ts` returns the checkout link and the status page URL.
- `app/invoice-result/page.tsx` displays the current invoice status.
- `app/api/xendit-webhook/route.ts` receives the webhook from Xendit and can mark payment as paid.

> Important: Xendit webhook responses are sent to the server, not to the browser.

## 9. Example URLs

- Create invoice: `https://your-app.vercel.app/api/create-invoice`
- Check status: `https://your-app.vercel.app/api/invoice-status`
- Webhook: `https://your-app.vercel.app/api/xendit-webhook`
- Redirect page: `https://your-app.vercel.app/invoice-result?externalId=demo-...`

## 10. Test the flow on Vercel

1. Create an invoice from the app.
2. Open the Xendit checkout URL.
3. Complete the payment in the simulator.
4. Confirm the browser is redirected to `invoice-result`.
5. Confirm the webhook log in Xendit shows a successful delivery.
6. Confirm Vercel logs or your backend logs show the webhook payload.

## 11. Common errors and fixes

- `403 Forbidden` → secret key permission issue or IP allowlist restriction.
- `UNSUPPORTED_CURRENCY` → the selected currency is not enabled for your Xendit account.
- `Missing XENDIT_SECRET_KEY environment variable.` → `.env` key is not set or not loaded.
- `400 Bad Request` on `/api/invoice-status` → use the correct `externalId` or invoice ID in the redirect URL.

## 12. Going live

When you are ready:

- Replace the test secret key with a live secret key.
- Make sure the live key has Invoice permissions.
- Confirm all required currencies are enabled.
- Deploy to production and use the production webhook URL.
