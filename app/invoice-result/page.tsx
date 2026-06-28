"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function InvoiceResultPage() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const externalId = searchParams.get("externalId");
  const [invoice, setInvoice] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchInvoiceStatus() {
      const invoiceKey =
        externalId || (invoiceId && invoiceId.startsWith("demo-") ? invoiceId : invoiceId);
      const field = externalId || (invoiceId && invoiceId.startsWith("demo-") ? "externalId" : "invoiceId");

      if (!invoiceKey) {
        setError("Missing invoiceId or externalId in the URL.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/invoice-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ [field]: invoiceKey }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to fetch invoice status.");
        }

        setInvoice(data.invoice);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoiceStatus();
  }, [invoiceId, externalId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Invoice status
          </p>
          <h1 className="text-3xl font-semibold">Payment result</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This page shows the latest invoice status after payment. It fetches the invoice details using the invoice ID or external ID from the URL.
          </p>
        </div>

        {!invoiceId ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            Missing invoice ID. Open this page with `?invoiceId=...` in the URL.
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100">
            Loading invoice status...
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {invoice ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <p className="font-medium">Current invoice status</p>
            <p className="mt-2">Invoice ID: {invoice.id}</p>
            <p className="mt-1">External ID: {invoice.externalId}</p>
            <p className="mt-1">Status: {invoice.status}</p>
            <p className="mt-1">Amount: {invoice.amount}</p>
            <p className="mt-1">Payment channel: {invoice.payment_channel || "N/A"}</p>
          </div>
        ) : null}

        {invoice ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100">
            <p className="font-medium">Full invoice response</p>
            <pre className="mt-2 overflow-x-auto text-xs leading-snug">
              {JSON.stringify(invoice, null, 2)}
            </pre>
          </div>
        ) : null}
      </main>
    </div>
  );
}
