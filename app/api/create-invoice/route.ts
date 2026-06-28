import { NextResponse } from "next/server";
import { xenditClient } from "@/lib/xendit";

export async function POST(request: Request) {
  if (!xenditClient) {
    return NextResponse.json(
      { error: "Missing XENDIT_SECRET_KEY environment variable." },
      { status: 500 },
    );
  }

  try {
    const { amount, description } = await request.json();

    if (!amount || !description) {
      return NextResponse.json(
        { error: "Amount and description are required." },
        { status: 400 },
      );
    }

    const origin = new URL(request.url).origin;

    // Use an externalId that we can also look up later.
    // Xendit will include this value as a query string when it redirects back.
    const externalId = `demo-${Date.now()}`;

    const invoice = await xenditClient.Invoice.createInvoice({
      data: {
        amount: Number(amount),
        description,
        externalId,
        currency: "PHP",
        reminderTime: 1,
        // Redirect the buyer to a status page after payment completes.
        successRedirectUrl: `${origin}/invoice-result?externalId=${encodeURIComponent(
          externalId,
        )}`,
        failureRedirectUrl: `${origin}/invoice-result?externalId=${encodeURIComponent(
          externalId,
        )}`,
      },
    });

    // Expose the same redirect link to the client so they can open a status page manually.
    const invoiceStatusUrl = `${origin}/invoice-result?externalId=${encodeURIComponent(
      externalId,
    )}`;

    return NextResponse.json({
      invoiceUrl: invoice.invoiceUrl,
      invoice,
      invoiceStatusUrl,
    });
  } catch (error) {
    console.error("Xendit invoice error:", error);

    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: number }).status)
        : 500;

    const message =
      status === 403
        ? "Xendit rejected the request. Check that your secret key has Invoice permissions and that your server IP is allowed if IP allowlisting is enabled."
        : status === 400 &&
            error &&
            typeof error === "object" &&
            "errorCode" in error &&
            (error as { errorCode?: string }).errorCode ===
              "UNSUPPORTED_CURRENCY"
          ? "Your Xendit account is not configured for IDR invoices yet. Switch to a supported currency or contact Xendit to enable IDR for this account."
          : error instanceof Error
            ? error.message
            : "Unable to create invoice right now.";

    return NextResponse.json({ error: message }, { status });
  }
}
