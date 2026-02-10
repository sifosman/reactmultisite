import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Create admin user
    const adminData = {
      email: 'thecoastalwarehouse@gmail.com',
      password: 'Sameer1964!',
      email_confirm: true
    };
    
    // Create user in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser(adminData);
    
    if (authError && !authError.message.includes('already registered')) {
      return NextResponse.json({ 
        error: "Failed to create auth user", 
        details: authError.message 
      }, { status: 500 });
    }
    
    // Get the user ID
    const userId = authUser.user?.id;
    
    if (userId) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: 'thecoastalwarehouse@gmail.com',
          full_name: 'Sameer',
          role: 'admin'
        });
      
      if (profileError) {
        return NextResponse.json({ 
          error: "Failed to create profile", 
          details: profileError.message 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      userId: userId,
      email: 'thecoastalwarehouse@gmail.com'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
