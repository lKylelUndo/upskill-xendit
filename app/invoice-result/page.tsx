import { Suspense } from "react";
import InvoiceResultClient from "./InvoiceResultClient";

export const dynamic = "force-dynamic";

export default function InvoiceResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            Loading invoice result...
          </div>
        </div>
      }
    >
      <InvoiceResultClient />
    </Suspense>
  );
}
