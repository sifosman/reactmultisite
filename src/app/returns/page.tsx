import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";

export const revalidate = 0;

export default async function ReturnsPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Returns & Exchanges</h1>
      
      <div className="mt-6 space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">How to log a return</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            To log a return or request an exchange, please WhatsApp us at <a href="https://wa.me/27713456393" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">071 3456 393</a>.
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Our team will guide you through the return process and provide all necessary instructions for sending back your items.
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Return Policy</h2>
          <div className="mt-3 text-sm leading-6 text-zinc-700 space-y-2">
            <p>• Items must be returned in their original condition</p>
            <p>• Returns must be logged within 30 days of purchase</p>
            <p>• Please keep your proof of purchase</p>
            <p>• Shipping costs for returns may apply</p>
          </div>
        </div>
      </div>
    </main>
  );
}
