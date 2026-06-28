import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Xendit sends webhook notifications as JSON POST requests.
  // In production, you should verify request authenticity using Xendit signature or callback token.
  const payload = await request.json();

  console.log("Xendit webhook payload:", JSON.stringify(payload, null, 2));

  // Xendit webhook data may arrive as:
  // 1) a wrapper object with type/event and data fields
  // 2) the raw invoice object itself
  const eventType = payload?.type || payload?.event || payload?.event_type;
  const invoice = payload?.data || payload?.invoice || payload;

  // Detect a paid invoice on either payload shape.
  const isPaidInvoice = invoice?.status === "PAID";

  if (isPaidInvoice) {
    // TODO: update your own database or application state here.
    // Example: mark invoice record as paid by invoice.id or invoice.external_id.
    console.log("Invoice paid:", invoice?.id || invoice?.external_id);
  }

  // This response is sent back to Xendit, not to the browser.
  // Xendit uses it to know the webhook was received successfully.

  return NextResponse.json({
    received: true,
    eventType: eventType ?? null,
    invoiceStatus: invoice?.status ?? null,
  });
}
