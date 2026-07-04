import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { discordToken, discordChannel, applicantName, applicantEmail, companyName, companyWebsite, pdfBase64, fileName } = await req.json();

    if (!discordToken || !discordChannel) {
      return NextResponse.json({ error: "Discord token and channel ID are required" }, { status: 400 });
    }

    const formData = new FormData();

    const message = {
      content: `📊 **New Company Research Report**\n\n👤 **Applicant:** ${applicantName} (${applicantEmail})\n🏢 **Company:** ${companyName}\n🌐 **Website:** ${companyWebsite}`,
    };

    formData.append("payload_json", JSON.stringify(message));

    if (pdfBase64) {
      const binaryStr = atob(pdfBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      formData.append("files[0]", blob, fileName || "report.pdf");
    }

    const res = await fetch(`https://discord.com/api/v10/channels/${discordChannel}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${discordToken}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Discord API error: ${res.status} - ${err}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
