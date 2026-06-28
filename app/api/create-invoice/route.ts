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

    const invoice = await xenditClient.Invoice.createInvoice({
      data: {
        amount: Number(amount),
        description,
        externalId: `demo-${Date.now()}`,
        currency: "PHP",
        reminderTime: 1,
      },
    });

    return NextResponse.json({
      invoiceUrl: invoice.invoiceUrl,
      invoice,
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
