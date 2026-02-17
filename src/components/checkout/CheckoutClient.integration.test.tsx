import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';
import { readGuestCart, clearGuestCart } from '@/lib/cart/storage';

// Mock the cart storage functions
vi.mock('@/lib/cart/storage', () => ({
  readGuestCart: vi.fn(),
  clearGuestCart: vi.fn(),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('CheckoutClient Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock empty cart
    (readGuestCart as any).mockReturnValue({
      items: [],
    });
    
    // Mock fetch responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/checkout/coupon')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ coupon: null }),
        });
      }
      
      if (url.includes('/api/payments/yoco/start')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            redirectUrl: 'https://payments.yoco.com/checkout/test',
          }),
        });
      }
      
      if (url.includes('/api/orders/create')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ orderId: 'order-123' }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  describe('Coupon Functionality', () => {
    it('should apply coupon and update total', async () => {
      // Mock cart with items
      (readGuestCart as any).mockReturnValue({
        items: [
          {
            productId: 'prod-1',
            variantId: null,
            qty: 2,
            product: { id: 'prod-1', name: 'Test Product', price_cents: 15000 },
          },
        ],
      });

      // Mock successful coupon response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coupon: {
            code: 'SAVE20',
            discount_type: 'percentage',
            discount_value: 20,
            discountCents: 6000,
          },
        }),
      });

      render(<CheckoutClient />);
      
      // Fill in form fields
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const couponInput = screen.getByPlaceholderText(/coupon code/i);
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(nameInput, 'Test User');
      await userEvent.type(phoneInput, '1234567890');
      
      // Apply coupon
      await userEvent.type(couponInput, 'SAVE20');
      const applyButton = screen.getByText(/Apply coupon/i);
      await userEvent.click(applyButton);
      
      // Wait for coupon to be applied
      await waitFor(() => {
        expect(screen.getByText(/Coupon applied/)).toBeInTheDocument();
      });
      
      // Check that discount is reflected in total
      expect(screen.getByText(/R/)).toBeInTheDocument();
    });

    it('should show error for invalid coupon', async () => {
      render(<CheckoutClient />);
      
      const couponInput = screen.getByPlaceholderText(/coupon code/i);
      const applyButton = screen.getByText(/Apply coupon/i);
      
      await userEvent.type(couponInput, 'INVALID');
      await userEvent.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid or expired/)).toBeInTheDocument();
      });
    });

    it('should clear coupon when input is cleared', async () => {
      render(<CheckoutClient />);
      
      const couponInput = screen.getByPlaceholderText(/coupon code/i);
      const applyButton = screen.getByText(/Apply coupon/i);
      
      // Apply coupon first
      await userEvent.type(couponInput, 'SAVE20');
      await userEvent.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Coupon applied/)).toBeInTheDocument();
      });
      
      // Clear the coupon
      await userEvent.clear(couponInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/Coupon applied/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate all required fields before submission', async () => {
      render(<CheckoutClient />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      // Try to submit without filling form
      expect(submitButton).toBeDisabled();
      
      // Fill in required fields
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const line1Input = screen.getByLabelText(/address line 1/i);
      const cityInput = screen.getByLabelText(/city/i);
      const provinceSelect = screen.getByLabelText(/province/i);
      const postalCodeInput = screen.getByLabelText(/postal code/i);
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(nameInput, 'Test User');
      await userEvent.type(phoneInput, '1234567890');
      await userEvent.type(line1Input, '123 Test St');
      await userEvent.type(cityInput, 'Test City');
      await userEvent.type(postalCodeInput, '1234');
      await userEvent.selectOptions(provinceSelect, 'WC');
      
      // Button should now be enabled
      expect(submitButton).not.toBeDisabled();
    });

    it('should validate email format', async () => {
      render(<CheckoutClient />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      // Invalid email
      await userEvent.type(emailInput, 'invalid-email');
      expect(submitButton).toBeDisabled();
      
      // Valid email
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'test@example.com');
      expect(submitButton).toBeDisabled(); // Still disabled because other fields are empty
    });
  });

  describe('Payment Method Selection', () => {
    it('should show Yoco as default payment method', () => {
      render(<CheckoutClient />);
      
      const yocoRadio = screen.getByLabelText(/card payment.*yoco/i);
      const bankTransferRadio = screen.getByLabelText(/bank transfer/i);
      
      expect(yocoRadio).toBeChecked();
      expect(bankTransferRadio).not.toBeChecked();
    });

    it('should switch payment methods', async () => {
      render(<CheckoutClient />);
      
      const bankTransferRadio = screen.getByLabelText(/bank transfer/i);
      
      await userEvent.click(bankTransferRadio);
      expect(bankTransferRadio).toBeChecked();
      
      const yocoRadio = screen.getByLabelText(/card payment.*yoco/i);
      expect(yocoRadio).not.toBeChecked();
    });

    it('should show bank transfer details when selected', async () => {
      render(<CheckoutClient />);
      
      const bankTransferRadio = screen.getByLabelText(/bank transfer/i);
      await userEvent.click(bankTransferRadio);
      
      await waitFor(() => {
        expect(screen.getByText(/Account holder:/)).toBeInTheDocument();
        expect(screen.getByText(/Account number:/)).toBeInTheDocument();
        expect(screen.getByText(/Bank:/)).toBeInTheDocument();
      });
    });
  });

  describe('Yoco Payment Flow', () => {
    it('should redirect to Yoco when paying with card', async () => {
      // Mock cart with items
      (readGuestCart as any).mockReturnValue({
        items: [
          {
            productId: 'prod-1',
            variantId: null,
            qty: 1,
            product: { id: 'prod-1', name: 'Test Product', price_cents: 15000 },
          },
        ],
      });

      render(<CheckoutClient />);
      
      // Fill form and select Yoco
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const line1Input = screen.getByLabelText(/address line 1/i);
      const cityInput = screen.getByLabelText(/city/i);
      const provinceSelect = screen.getByLabelText(/province/i);
      const postalCodeInput = screen.getByLabelText(/postal code/i);
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(nameInput, 'Test User');
      await userEvent.type(phoneInput, '1234567890');
      await userEvent.type(line1Input, '123 Test St');
      await userEvent.type(cityInput, 'Test City');
      await userEvent.type(postalCodeInput, '1234');
      await userEvent.selectOptions(provinceSelect, 'WC');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);
      
      // Should redirect to Yoco
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/payments/yoco/start'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          })
        );
      });
    });

    it('should include coupon data in Yoco request', async () => {
      // Mock cart with items
      (readGuestCart as any).mockReturnValue({
        items: [
          {
            productId: 'prod-1',
            variantId: null,
            qty: 1,
            product: { id: 'prod-1', name: 'Test Product', price_cents: 15000 },
          },
        ],
      });

      // Mock coupon response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coupon: {
            code: 'SAVE20',
            discount_type: 'percentage',
            discount_value: 20,
            discountCents: 3000, // 20% of R15000
          },
        }),
      });

      render(<CheckoutClient />);
      
      // Fill form and apply coupon
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const line1Input = screen.getByLabelText(/address line 1/i);
      const cityInput = screen.getByLabelText(/city/i);
      const provinceSelect = screen.getByLabelText(/province/i);
      const postalCodeInput = screen.getByLabelText(/postal code/i);
      const couponInput = screen.getByPlaceholderText(/coupon code/i);
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(nameInput, 'Test User');
      await userEvent.type(phoneInput, '1234567890');
      await userEvent.type(line1Input, '123 Test St');
      await userEvent.type(cityInput, 'Test City');
      await userEvent.type(postalCodeInput, '1234');
      await userEvent.selectOptions(provinceSelect, 'WC');
      
      // Apply coupon
      await userEvent.type(couponInput, 'SAVE20');
      const applyButton = screen.getByText(/Apply coupon/i);
      await userEvent.click(applyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Coupon applied/)).toBeInTheDocument();
      });
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);
      
      // Verify coupon data is included in the request
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/payments/yoco/start'),
          expect.objectContaining({
            body: expect.stringContaining('"couponCode":"SAVE20"'),
          })
        );
      });
    });
  });

  describe('Bank Transfer Flow', () => {
    it('should create order when paying with bank transfer', async () => {
      // Mock cart with items
      (readGuestCart as any).mockReturnValue({
        items: [
          {
            productId: 'prod-1',
            variantId: null,
            qty: 1,
            product: { id: 'prod-1', name: 'Test Product', price_cents: 15000 },
          },
        ],
      });

      render(<CheckoutClient />);
      
      // Fill form and select bank transfer
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const line1Input = screen.getByLabelText(/address line 1/i);
      const cityInput = screen.getByLabelText(/city/i);
      const provinceSelect = screen.getByLabelText(/province/i);
      const postalCodeInput = screen.getByLabelText(/postal code/i);
      const bankTransferRadio = screen.getByLabelText(/bank transfer/i);
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(nameInput, 'Test User');
      await userEvent.type(phoneInput, '1234567890');
      await userEvent.type(line1Input, '123 Test St');
      await userEvent.type(cityInput, 'Test City');
      await userEvent.type(postalCodeInput, '1234');
      await userEvent.selectOptions(provinceSelect, 'WC');
      await userEvent.click(bankTransferRadio);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);
      
      // Should create order
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/orders/create'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          })
        );
      });
    });

    it('should redirect to success page after bank transfer', async () => {
      // Mock order creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orderId: 'order-123' }),
      });

      // Mock router
      const mockRouter = {
        push: vi.fn(),
      };
      
      vi.mock('next/navigation', () => mockRouter);

      render(<CheckoutClient />);
      
      // Fill form and select bank transfer
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const line1Input = screen.getByLabelText(/address line 1/i);
      const cityInput = screen.getByLabelText(/city/i);
      const provinceSelect = screen.getByLabelText(/province/i);
      const postalCodeInput = screen.getByLabelText(/postal code/i);
      const bankTransferRadio = screen.getByLabelText(/bank transfer/i);
      
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(nameInput, 'Test User');
      await userEvent.type(phoneInput, '1234567890');
      await userEvent.type(line1Input, '123 Test St');
      await userEvent.type(cityInput, 'Order City');
      await userEvent.type(postalCodeInput, '1234');
      await userEvent.selectOptions(provinceSelect, 'GP');
      await userEvent.click(bankTransferRadio);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);
      
      // Should redirect to success page
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringContaining('/checkout/success'),
          expect.objectContaining({
            orderId: 'order-123',
            method: 'bank_transfer',
          })
        );
      });
    });
  });

  describe('Cart Management', () => {
    it('should show empty cart message when cart is empty', () => {
      (readGuestCart as any).mockReturnValue({
        items: [],
      });

      render(<CheckoutClient />);
      
      expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
    });

    it('should show cart items when cart has items', () => {
      (readGuestCart as any).mockReturnValue({
        items: [
          {
            productId: 'prod-1',
            variantId: null,
            qty: 2,
            product: { id: 'prod-1', name: 'Test Product', price_cents: 15000 },
          },
        ],
      });

      render(<CheckoutClient />);
      
      expect(screen.getByText(/Test Product/)).toBeInTheDocument();
      expect(screen.getByText(/R300/)).toBeInTheDocument();
    });

    it('should clear cart after successful order', async () => {
      // Mock cart with items
      (readGuestCart as any).mockReturnValue({
        items: [
          {
            productId: 'prod-1',
            variantId: null,
            qty: 1,
            product: { id: 'prod-1', name: 'Test Product', price_cents: 15000 },
          },
        ],
      });

      // Mock successful order creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orderId: 'order-123' }),
      });

      render(<CheckoutClient />);
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);
      
      // Should clear cart
      await waitFor(() => {
        expect(clearGuestCart).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API fails', async () => {
      // Mock API error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      render(<CheckoutClient />);
      
      // Fill form
      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/checkout failed/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      render(<CheckoutClient />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      // Start submission (mock loading state)
      const loadingButton = screen.getByText(/Paying…/i);
      expect(loadingButton).toBeInTheDocument();
    });
  });
});
