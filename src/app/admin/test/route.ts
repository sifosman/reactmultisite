import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Admin routes are working",
    timestamp: new Date().toISOString(),
    routes: {
      admin: "/admin",
      adminLogin: "/admin/login",
      adminDashboard: "/admin"
    }
  });
}

export const dynamic = 'force-dynamic';
