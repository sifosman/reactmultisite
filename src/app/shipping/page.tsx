import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";

export const revalidate = 0;

export default async function ShippingPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Shipping Information</h1>
      
      <div className="mt-6 space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Delivery Rates</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            Delivery is available nationwide at a flat rate of <strong>R60</strong> for orders placed via the website.
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Delivery Areas</h2>
          <div className="mt-3 text-sm leading-6 text-zinc-700 space-y-2">
            <p>• We deliver throughout South Africa</p>
            <p>• Standard delivery within 1-3 working days</p>
            <p>• Remote areas may take longer</p>
            <p>• Tracking provided for all orders</p>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Order Processing</h2>
          <div className="mt-3 text-sm leading-6 text-zinc-700 space-y-2">
            <p>• Orders are processed within 24 hours</p>
            <p>• You'll receive tracking details once shipped</p>
            <p>• Delivery time: 1-3 working days after dispatch</p>
          </div>
        </div>
      </div>
    </main>
  );
}
