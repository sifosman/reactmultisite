import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING",
      BREVO_API_KEY: process.env.BREVO_API_KEY ? "SET" : "MISSING",
      BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL ? "SET" : "MISSING",
      BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME ? "SET" : "MISSING",
      NODE_ENV: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  });
}
