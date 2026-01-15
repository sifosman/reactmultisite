export type InvoiceCustomerSnapshot = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export function getInvoiceCustomerDisplay(snapshot: InvoiceCustomerSnapshot | null | undefined): {
  primary: string;
  secondary: string | null;
} {
  if (!snapshot) {
    return { primary: "Guest / walk-in", secondary: null };
  }

  const name = snapshot.name?.trim();
  const email = snapshot.email?.trim();
  const phone = snapshot.phone?.trim();

  if (name) {
    return { primary: name, secondary: phone || email || null };
  }

  if (email) {
    return { primary: email, secondary: phone || null };
  }

  if (phone) {
    return { primary: phone, secondary: null };
  }

  return { primary: "Guest / walk-in", secondary: null };
}
