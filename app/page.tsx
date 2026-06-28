"use client";

import { useState, type FormEvent } from "react";

export default function Home() {
  const [amount, setAmount] = useState("25000");
  const [description, setDescription] = useState("Starter package");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [invoiceStatusUrl, setInvoiceStatusUrl] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setInvoiceUrl(null);
    setInvoiceStatusUrl(null);

    try {
      const response = await fetch("/api/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create invoice");
      }

      setInvoiceUrl(data.invoiceUrl);
      setInvoiceStatusUrl(data.invoiceStatusUrl ?? null);
      setInvoiceData(data.invoice);
      setStatusMessage(data.invoice?.status ? `Invoice status: ${data.invoice.status}` : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Xendit demo
          </p>
          <h1 className="text-3xl font-semibold">Create a simple payment invoice</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enter an amount and description, then generate a payment link with Xendit.
            If you see a 403 error, your Xendit key likely needs Invoice permissions or your server IP must be allowlisted.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            Amount (PHP)
            <input
              type="number"
              min="1000"
              step="1000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none ring-0 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </label>

          <label className="block text-sm font-medium">
            Description
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none ring-0 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {isLoading ? "Creating invoice..." : "Create invoice"}
          </button>
        </form>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {invoiceUrl ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <p className="font-medium">Invoice ready</p>
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex break-all text-emerald-700 underline dark:text-emerald-300"
            >
              {invoiceUrl}
            </a>
            {invoiceStatusUrl ? (
              <p className="mt-2 text-sm">
                Check the payment result after checkout:&nbsp;
                <a
                  href={invoiceStatusUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 underline dark:text-emerald-300"
                >
                  View status page
                </a>
              </p>
            ) : null}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <p className="font-medium">{statusMessage}</p>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              If the user completes payment, the status will become paid.
            </p>
          </div>
        ) : null}

        {invoiceData ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100">
            <p className="font-medium">Invoice response data</p>
            <pre className="mt-2 overflow-x-auto text-xs leading-snug">
              {JSON.stringify(invoiceData, null, 2)}
            </pre>
          </div>
        ) : null}
      </main>
    </div>
  );
}
