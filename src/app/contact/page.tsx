import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";
import { ContactForm } from "@/components/site/ContactForm";

export const revalidate = 0;

export default async function ContactPage() {
  const supabase = await createPublicSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("data")
    .eq("key", "site")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const site = (data?.data ?? {}) as Record<string, unknown>;
  const pages = (site.pages ?? {}) as Record<string, unknown>;
  const contact = (site.contact ?? {}) as Record<string, unknown>;

  const body = typeof pages.contact === "string" ? pages.contact : "";
  const email = typeof contact.email === "string" ? contact.email : "";
  const phone = typeof contact.phone === "string" ? contact.phone : "";
  const address = typeof contact.address === "string" ? contact.address : "";

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h1 className="text-2xl font-semibold tracking-tight">Contact Us</h1>
          {body ? (
            <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{body}</div>
          ) : (
            <p className="mt-4 text-sm text-zinc-600">
              Have a question about an order or our products? Send us a message using the form below.
            </p>
          )}

          <div className="mt-6 rounded-2xl border bg-white p-4 text-zinc-900 shadow-sm sm:p-6">
            <ContactForm />
          </div>
        </section>

        <aside className="space-y-4 rounded-xl border bg-white p-4 text-sm text-zinc-700">
          <div>
            <div className="text-sm font-semibold">Contact details</div>
            <div className="mt-2 space-y-1 text-sm">
              {email ? <div>Email: <a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a></div> : null}
              {phone ? <div>Phone: <a href={`tel:${phone}`} className="text-blue-600 hover:underline">{phone}</a></div> : null}
              {address ? <div className="whitespace-pre-wrap">{address}</div> : null}
              {!email && !phone && !address ? (
                <div className="text-xs text-zinc-500">Contact details will appear here once configured in Site Content.</div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
