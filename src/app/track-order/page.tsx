import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";

export const revalidate = 0;

export default async function TrackOrderPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Track Your Order</h1>
      
      <div className="mt-6 space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">How Tracking Works</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            Once payment is completed within 1-3 working days, you will receive a tracking number via the phone number provided along with the courier service details for tracking.
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Tracking Process</h2>
          <div className="mt-3 text-sm leading-6 text-zinc-700 space-y-2">
            <p>• Order confirmation sent immediately after purchase</p>
            <p>• Payment processed within 24 hours</p>
            <p>• Tracking number sent within 1-3 working days</p>
            <p>• Courier details included with tracking number</p>
            <p>• Track your parcel online or via courier app</p>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Need Help?</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            If you haven't received your tracking details within the specified timeframe, please contact us via WhatsApp at <a href="https://wa.me/27713456393" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">071 3456 393</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
