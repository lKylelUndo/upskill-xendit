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
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required." },
        { status: 400 }
      );
    }

    const invoice = await xenditClient.Invoice.getInvoiceById({
      invoiceId,
    });

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
