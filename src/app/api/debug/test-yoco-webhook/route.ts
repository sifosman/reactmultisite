import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createOrderFromData } from "@/lib/checkout/createOrderFromData";
import { sendOrderPaidEmail } from "@/lib/brevo/sendOrderPaidEmail";

export async function POST(req: Request) {
  const supabaseAdmin = createSupabaseAdminClient();
  
  try {
    // Create a test pending checkout first
    const { data: testPendingCheckout, error: pendingError } = await supabaseAdmin
      .from("pending_checkouts")
      .insert({
        user_id: null,
        customer_email: "test@example.com",
        customer_name: "Test Customer",
        customer_phone: "+27123456789",
        shipping_address_snapshot: {
          line1: "123 Test St",
          city: "Test City",
          province: "Western Cape",
          postal_code: "8001",
          country: "South Africa"
        },
        items: [
          {
            productId: "test-product-id",
            variantId: null,
            qty: 1
          }
        ],
        total_cents: 10000,
        currency: "ZAR",
        checkout_id: "test-checkout-123",
        status: "initiated"
      })
      .select()
      .single();
      
    if (pendingError) {
      return NextResponse.json({ error: "Failed to create test pending checkout", details: pendingError }, { status: 500 });
    }
    
    // Simulate Yoco webhook payload
    const mockWebhookEvent = {
      id: "evt_test_" + Date.now(),
      type: "payment.succeeded",
      payload: {
        id: "pay_test_" + Date.now(),
        status: "succeeded",
        metadata: {
          pendingCheckoutId: testPendingCheckout.id
        },
        amount: 10000,
        currency: "ZAR"
      }
    };
    
    // Store the event (simulating webhook verification)
    const { error: eventError } = await supabaseAdmin
      .from("payment_events")
      .insert({
        provider: "yoco",
        provider_event_id: mockWebhookEvent.id,
        raw_payload: mockWebhookEvent,
      });
      
    if (eventError) {
      return NextResponse.json({ error: "Failed to store payment event", details: eventError }, { status: 500 });
    }
    
    // Test the order creation process
    const items = testPendingCheckout.items as Array<{
      productId: string;
      variantId: string | null;
      qty: number;
    }>;
    
    const shippingAddress = testPendingCheckout.shipping_address_snapshot as {
      line1: string;
      line2?: string;
      city: string;
      province: string;
      postal_code: string;
      country: string;
    };
    
    try {
      const { orderId, totalCents } = await createOrderFromData({
        userId: testPendingCheckout.user_id,
        customer: {
          email: testPendingCheckout.customer_email,
          name: testPendingCheckout.customer_name,
          phone: testPendingCheckout.customer_phone,
        },
        shippingAddress,
        items,
        status: "paid",
      });
      
      // Record the payment
      await supabaseAdmin.from("payments").insert({
        order_id: orderId,
        provider: "yoco",
        provider_payment_id: mockWebhookEvent.payload.id,
        amount_cents: totalCents,
        currency: testPendingCheckout.currency,
        status: "succeeded",
        raw_payload: mockWebhookEvent,
      });
      
      // Update pending checkout status
      await supabaseAdmin
        .from("pending_checkouts")
        .update({ status: "completed" })
        .eq("id", testPendingCheckout.id);
      
      // Test email sending
      let emailResult = "skipped";
      try {
        await sendOrderPaidEmail(orderId);
        emailResult = "sent";
      } catch (emailError) {
        emailResult = `failed: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`;
      }
      
      return NextResponse.json({
        success: true,
        orderId,
        totalCents,
        emailResult,
        testPendingCheckoutId: testPendingCheckout.id,
        mockEventId: mockWebhookEvent.id
      });
      
    } catch (orderError) {
      return NextResponse.json({ 
        error: "Order creation failed", 
        details: orderError instanceof Error ? orderError.message : 'Unknown error',
        testPendingCheckoutId: testPendingCheckout.id
      }, { status: 500 });
    }
    
  } catch (error) {
    return NextResponse.json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
