import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";

export const revalidate = 0;

export default async function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Frequently Asked Questions</h1>
      
      <div className="mt-8 space-y-8">
        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold text-zinc-900">Q: About us</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Coastal Warehouse is an online store located in Verulam, near the coast. Our primary focus is on handbags, with a range of products. We also offer wholesale opportunities for resellers.
          </p>
        </div>

        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold text-zinc-900">Q: How do I resell?</h2>
          <div className="mt-2 text-sm leading-6 text-zinc-700 space-y-3">
            <p>
              <strong>Join our Whatsapp group for updates.</strong>
            </p>
            <p className="font-semibold">Advertising made easy</p>
            <div className="space-y-2">
              <p><strong>Step 1:</strong> Take the adverts sent out on the group and advertise.</p>
              <p><strong>Step 2:</strong> You will need to add your markup for your profit.</p>
              <p><strong>Step 3:</strong> You may advertise on:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>WhatsApp status</li>
                <li>WhatsApp group</li>
                <li>Facebook</li>
                <li>Instagram</li>
                <li>etc</li>
              </ul>
              <p><strong>Step 4:</strong> Send through confirmed orders via WhatsApp.</p>
              <p>We will keep aside your order until you have built up an invoice (within an appropriate amount of time)</p>
            </div>
            <p><strong>● Delivery available throughout SA</strong></p>
            <p>Stock buys also welcomed for those wanting to purchase stock</p>
          </div>
        </div>

        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold text-zinc-900">Q: How do I return an item?</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Please WhatsApp <a href="https://wa.me/27713456393" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">071 3456 393</a> to log a return.
          </p>
        </div>

        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold text-zinc-900">Q: Do you have a showroom to view items?</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Yes, based in Verulam, only by appointment. WhatsApp now to book your appointment <a href="https://wa.me/27713456393" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">071 3456 393</a>.
          </p>
        </div>

        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold text-zinc-900">Q: How do I review your business?</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Please leave a review on Google using this link: <a href="https://g.page/r/CYfGXe1NXnWGEAE/review" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://g.page/r/CYfGXe1NXnWGEAE/review</a>
          </p>
        </div>
      </div>
    </main>
  );
}
