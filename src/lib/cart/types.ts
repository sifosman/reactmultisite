export type GuestCartItem = {
  productId: string;
  variantId: string | null;
  qty: number;
};

export type GuestCart = {
  version: 1;
  items: GuestCartItem[];
};
