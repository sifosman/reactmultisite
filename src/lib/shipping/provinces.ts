export const PROVINCES = [
  "Western Cape",
  "Eastern Cape",
  "Northern Cape",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Free State",
] as const;

export type Province = (typeof PROVINCES)[number];
