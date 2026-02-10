import Link from "next/link";

import { YocoSuccessClient } from "@/components/checkout/YocoSuccessClient";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; method?: string; pendingCheckoutId?: string }>;
}) {
  const { orderId, method, pendingCheckoutId } = await searchParams;
  const paymentMethod = method === "bank_transfer" ? "bank_transfer" : "yoco";

  return (
    <main className="mx-auto max-w-3xl p-6">
      {paymentMethod === "yoco" ? (
        <>
          <h1 className="text-2xl font-semibold">Payment successful</h1>

          <div className="mt-2 text-sm text-zinc-600">
            We’re finalizing your order. This can take a few seconds.
          </div>

          <div className="mt-6">
            <YocoSuccessClient pendingCheckoutId={pendingCheckoutId ?? null} />
          </div>

          <div className="mt-6 flex gap-3">
            <Link className="rounded-md bg-black px-4 py-2 text-sm text-white" href="/products">
              Continue shopping
            </Link>
            <Link className="rounded-md border px-4 py-2 text-sm" href="/account">
              View orders
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Order created</h1>
          <div className="mt-2 text-sm text-zinc-600">
            Your order is created with status <span className="font-medium">pending_payment</span>.
          </div>

          <div className="mt-6 rounded-xl border bg-white p-4">
            <div className="text-sm text-zinc-600">Order ID</div>
            <div className="mt-1 break-all font-mono text-sm">{orderId ?? "(missing)"}</div>
          </div>

          <div className="mt-6 rounded-xl border bg-white p-4 text-sm text-zinc-700">
            <div className="font-semibold">Bank transfer details</div>
            <div className="mt-3 space-y-1">
              <div>
                <span className="font-medium">Account holder: </span>
                <span>S Kadwa</span>
              </div>
              <div>
                <span className="font-medium">Account number: </span>
                <span>9285283250</span>
              </div>
              <div>
                <span className="font-medium">Bank: </span>
                <span>Absa</span>
              </div>
              <div>
                <span className="font-medium">Account type: </span>
                <span>Savings</span>
              </div>
              <div className="mt-3 text-xs text-zinc-600">
                Please use your order ID as the payment reference. Your order will be processed once payment is
                received.
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Link className="rounded-md bg-black px-4 py-2 text-sm text-white" href="/products">
              Continue shopping
            </Link>
            <Link className="rounded-md border px-4 py-2 text-sm" href="/account">
              Account
            </Link>
          </div>

          <div className="mt-8 text-sm text-zinc-600">
            Make an EFT using the bank details above. We'll update your order once the transfer reflects.
          </div>
        </>
      )}
    </main>
  );
}
