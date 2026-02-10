import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Create a test order with sifosman@gmail.com
    const testOrder = {
      customer_email: "sifosman@gmail.com",
      customer_name: "Asif Osman",
      customer_phone: "0658475289",
      status: "pending_payment",
      subtotal_cents: 25000,
      shipping_cents: 6000,
      discount_cents: 0,
      total_cents: 31000,
      currency: "ZAR",
      shipping_address_snapshot: {
        city: "Johannesburg",
        line1: "123 Test Street",
        line2: "Apartment 4B",
        country: "ZA",
        province: "Gauteng",
        postal_code: "2001"
      }
    };
    
    console.log("Creating test order for sifosman@gmail.com:", testOrder);
    
    // Insert the order
    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert(testOrder)
      .select()
      .single();
    
    if (insertError) {
      console.error("Failed to create order:", insertError);
      return NextResponse.json({ 
        error: "Failed to create order", 
        details: insertError.message 
      }, { status: 500 });
    }
    
    console.log("Order created successfully:", order);
    
    // Now trigger the bank transfer email
    try {
      const { sendBankTransferOrderEmail } = await import("@/lib/brevo/sendBankTransferOrderEmail");
      await sendBankTransferOrderEmail(order.id);
      console.log("Bank transfer email sent successfully");
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      return NextResponse.json({ 
        error: "Order created but email failed", 
        details: emailError instanceof Error ? emailError.message : "Unknown email error",
        order: order
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Test order created and email sent successfully",
      order: order,
      customerEmail: "sifosman@gmail.com"
    });
    
  } catch (error) {
    console.error("Test order error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
