import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { ReportDocument } from "../../../lib/pdf/ReportDocument";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { report } = await req.json();

    const element = React.createElement(ReportDocument, { report });
    const stream = await renderToStream(element);

    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as any) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report.companyName.replace(/\s+/g, "_")}_report.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
