# Xendit Setup and Local Integration Guide

This guide explains how to set up the Xendit invoice flow in this Next.js app from scratch, including the API key permission settings.

## 1. Install the project

```bash
cd c:\Users\Kyle Ando\Desktop\practice\upskill-xendit
npm install
```

## 2. Create environment variables

Create a `.env` file in the project root with your Xendit secret key:

```env
XENDIT_SECRET_KEY=REPLACE_WITH_YOUR_XENDIT_SECRET_KEY
```

> Use the Xendit secret key, not the public key. For local testing, use a test secret key.

## 3. Configure Xendit API key permissions

In the Xendit Dashboard:

1. Open **Developers** → **API Keys**.
2. Create a new secret key or select an existing one.
3. Grant the key permission for the **Invoice** API.
   - Do not use a key that only has Money-out / Disbursements permissions for this invoice flow.
4. If IP allowlisting is enabled in your Xendit account, add the public IP address of the machine or server running this app.

### Why this matters

- The app uses the Xendit Invoice API.
- If the key is missing Invoice permission, Xendit returns a `403 Forbidden` error.
- If IP allowlist is enabled and your current IP is not listed, the request will also fail.

## 4. Code files and how they are wired

### `lib/xendit.ts`

This file creates the Xendit SDK client using `XENDIT_SECRET_KEY`:

```ts
import { Xendit } from "xendit-node";

export const xenditClient = process.env.XENDIT_SECRET_KEY
  ? new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY })
  : null;
```

### `app/api/create-invoice/route.ts`

This API route receives the invoice request from the client and creates a Xendit invoice:

- It reads `amount` and `description`.
- It calls `xenditClient.Invoice.createInvoice()`.
- It returns `invoiceUrl` and the full `invoice` object.

### `app/api/invoice-status/route.ts`

This optional route can fetch invoice status by `invoiceId`:

- It calls `xenditClient.Invoice.getInvoiceById({ invoiceId })`.
- It returns the latest invoice status.

### `app/page.tsx`

This page contains the form and displays:

- invoice creation result
- invoice payment link (`invoiceUrl`)
- invoice response data for debugging
- current invoice status message

## 5. Run the app locally

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## 6. Test the flow

1. Enter an amount and description.
2. Submit the form.
3. The app creates a Xendit invoice and returns a checkout URL.
4. Open the checkout URL and complete the payment in the simulator.
5. To verify payment success, check the invoice status.

## 7. Add webhook support for payment success

The app now includes a webhook endpoint at `app/api/xendit-webhook/route.ts`.

- Xendit will send invoice events to this URL when invoice status changes.
- You should configure a publicly reachable HTTPS URL in the Xendit Dashboard.
- `http://localhost:3000/api/xendit-webhook` does not work directly in Xendit because Dashboard webhooks must reach a public URL.

### Local testing with ngrok

1. Install ngrok if you do not have it:
   - Download from https://ngrok.com/download
   - Unzip and place the `ngrok` executable somewhere on your machine.

2. Run your Next.js app locally:

```bash
npm run dev
```

3. Start an ngrok tunnel to port 3000:

```bash
npx ngrok http 3000
```

4. Copy the HTTPS forwarding URL shown by ngrok, for example:

```text
https://abcd1234.ngrok.io
```

5. In Xendit Dashboard, set the webhook URL to:

```text
https://abcd1234.ngrok.io/api/xendit-webhook
```

6. Use the Dashboard webhook test or create a fresh invoice and complete payment.

### Deploying to Vercel instead of ngrok

If you prefer not to use ngrok, deploy the app to Vercel and use its public URL.

1. Push your project to GitHub.
2. Connect the repo to Vercel or use the Vercel CLI.
3. Deploy the app.
4. In the Vercel dashboard, add these environment variables:
   - `XENDIT_SECRET_KEY`
   - `XENDIT_PUBLIC_KEY`
   - `WEBHOOK_VERIFICATION_TOKEN` (if you use webhook verification)

5. Use the deployed webhook URL in Xendit, for example:

```text
https://your-app.vercel.app/api/xendit-webhook
```

> Using Vercel is often easier for webhook testing because Xendit can reach a public HTTPS URL without tunneling.

### What happens next

- Xendit posts webhook payloads to your endpoint.
- The handler logs the payload and checks for `invoice.status` events.
- When `status` is `PAID`, you can update your database or mark the invoice as paid.

> Note: ngrok works for local dev, but a production webhook URL must be a secure public HTTPS endpoint.

## 8. What to look for on successful payment

The invoice object returned by Xendit contains:

- `invoice.id` — the invoice identifier
- `invoice.status` — should become `PAID` after payment
- `invoice.invoiceUrl` — the payment link
- `invoice.amount` — the requested amount
- `invoice.externalId` — the app-generated external ID

## 8. Common errors and fixes

- `403 Forbidden` → secret key permission issue or IP allowlist restriction.
- `UNSUPPORTED_CURRENCY` → the selected currency is not enabled for your Xendit account.
- `Missing XENDIT_SECRET_KEY environment variable.` → `.env` key is not set or not loaded.

## 9. Going live

When ready to go live:

- Replace the test secret key with a live secret key.
- Make sure the live key has Invoice permissions.
- Confirm all required currencies are enabled for the live account.
- If using allowlist, add the production server IP.
