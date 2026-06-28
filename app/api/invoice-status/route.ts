import { NextResponse } from "next/server";
import { xenditClient } from "@/lib/xendit";

export async function POST(request: Request) {
  if (!xenditClient) {
    return NextResponse.json(
      { error: "Missing XENDIT_SECRET_KEY environment variable." },
      { status: 500 }
    );
  }

  try {
    const { invoiceId, externalId } = await request.json();

    if (!invoiceId && !externalId) {
      return NextResponse.json(
        { error: "invoiceId or externalId is required." },
        { status: 400 }
      );
    }

    let invoice;
    const requestExternalId =
      externalId ||
      (invoiceId && invoiceId.startsWith("demo-") ? invoiceId : undefined);

    if (invoiceId && !requestExternalId) {
      // invoiceId is a real Xendit invoice ID, not an externalId.
      invoice = await xenditClient.Invoice.getInvoiceById({ invoiceId });
    } else {
      // If we only have demo-..., treat that as externalId and use getInvoices().
      const invoices = await xenditClient.Invoice.getInvoices({
        externalId: requestExternalId,
        limit: 1,
      });
      invoice = invoices?.[0] ?? null;
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Xendit invoice status error:", error);

    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: number }).status)
        : 500;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to get invoice status right now.",
      },
      { status }
    );
  }
}
