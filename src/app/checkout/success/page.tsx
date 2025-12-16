import Link from "next/link";
import { PayNowButton } from "@/components/checkout/PayNowButton";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Order created</h1>
      <div className="mt-2 text-sm text-zinc-600">
        Your order is created with status <span className="font-medium">pending_payment</span>.
      </div>

      <div className="mt-6 rounded-xl border bg-white p-4">
        <div className="text-sm text-zinc-600">Order ID</div>
        <div className="mt-1 break-all font-mono text-sm">{orderId ?? "(missing)"}</div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link className="rounded-md bg-black px-4 py-2 text-sm text-white" href="/products">
          Continue shopping
        </Link>
        <Link className="rounded-md border px-4 py-2 text-sm" href="/account">
          Account
        </Link>
      </div>

      {orderId ? (
        <div className="mt-6">
          <PayNowButton orderId={orderId} />
        </div>
      ) : null}

      <div className="mt-8 text-sm text-zinc-600">
        Next: we’ll redirect you to Yoco for payment and confirm payment via webhook.
      </div>
    </main>
  );
}
