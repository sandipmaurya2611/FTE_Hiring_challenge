import { NextResponse } from "next/server";

// PDF generation has been moved to the client side using @react-pdf/renderer's
// browser build (see ReportDashboard.tsx). This route is no longer used and
// exists only as a stub to prevent 404s if called directly.
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { error: "PDF generation is now handled client-side. This endpoint is deprecated." },
    { status: 410 }
  );
}
