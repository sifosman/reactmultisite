import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; method?: string }>;
}) {
  const { orderId, method } = await searchParams;
  const paymentMethod = method === "bank_transfer" ? "bank_transfer" : "yoco";

  return (
    <main className="mx-auto max-w-3xl p-6">
      {paymentMethod === "yoco" ? (
        <>
          <h1 className="text-2xl font-semibold">Payment successful</h1>
          <div className="mt-2 text-sm text-zinc-600">
            Your payment has been received and your order has been created.
          </div>

          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <div className="font-semibold">✓ Order confirmed</div>
            <div className="mt-2">
              We've sent an email to your inbox with your order details and tracking information. Your order will be
              processed and shipped soon.
            </div>
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
