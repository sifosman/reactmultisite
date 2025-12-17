"use client";

function normalizeWhatsAppNumber(input: string) {
  const digits = input.replace(/\D+/g, "");
  return digits;
}

export function FloatingWhatsAppButton({
  phoneNumber,
}: {
  phoneNumber?: string;
}) {
  const normalized = phoneNumber ? normalizeWhatsAppNumber(phoneNumber) : "";
  if (!normalized) return null;

  const href = `https://wa.me/${normalized}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-20 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] shadow-lg sm:bottom-6 sm:right-6"
    >
      <svg
        viewBox="0 0 32 32"
        width="22"
        height="22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16.015 4C9.39 4 4 9.39 4 16.015c0 2.086.55 4.116 1.59 5.907L4 28l6.246-1.538a11.98 11.98 0 0 0 5.77 1.47h.005C22.64 27.932 28 22.55 28 15.99 28 9.39 22.64 4 16.015 4Zm0 21.8h-.004a9.94 9.94 0 0 1-5.06-1.387l-.363-.216-3.706.912.99-3.61-.236-.37a9.9 9.9 0 0 1-1.524-5.114c0-5.49 4.47-9.96 9.903-9.96 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.908 6.985c0 5.49-4.47 9.86-9.898 9.86Zm5.76-7.876c-.313-.157-1.847-.91-2.134-1.012-.288-.105-.498-.157-.707.157-.209.312-.813 1.012-.997 1.22-.184.21-.367.236-.68.08-.313-.157-1.32-.485-2.514-1.547-.93-.83-1.558-1.855-1.742-2.168-.183-.314-.02-.483.137-.64.14-.14.313-.367.47-.55.157-.184.209-.313.313-.522.105-.21.053-.393-.026-.55-.078-.157-.707-1.705-.97-2.334-.256-.616-.516-.533-.707-.543l-.603-.01c-.209 0-.55.08-.837.393-.287.314-1.098 1.074-1.098 2.622s1.125 3.045 1.282 3.256c.157.209 2.215 3.38 5.36 4.74.748.323 1.333.515 1.788.66.75.24 1.434.206 1.974.125.602-.09 1.847-.756 2.107-1.486.262-.73.262-1.357.184-1.486-.079-.13-.287-.21-.6-.367Z"
          fill="#ffffff"
        />
      </svg>
    </a>
  );
}
