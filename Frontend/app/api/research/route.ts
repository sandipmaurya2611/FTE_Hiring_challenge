import { NextRequest, NextResponse } from "next/server";
import { crawl } from "../../../lib/crawler/crawl";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const runtime = "edge";

const SERPER_URL = "https://google.serper.dev/search";

async function serperSearch(query: string, apiKey: string, num = 5) {
  const res = await fetch(SERPER_URL, {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, num }),
  });
  if (!res.ok) throw new Error(`Serper error: ${res.status}`);
  return res.json();
}

function isUrl(str: string): boolean {
  try { new URL(str); return true; } catch { return false; }
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const { query, openRouterKey, serperKey, aiModel } = await req.json();

        let targetUrl = "";
        let phone = "";
        let address = "";

        send({ type: "progress", message: "🔍 Searching for company information..." });

        // Step 1: Resolve website
        if (isUrl(query)) {
          targetUrl = query;
        } else {
          const searchData = await serperSearch(`${query} official website`, serperKey, 3);
          // Try knowledge graph first
          const kg = searchData.knowledgeGraph;
          if (kg) {
            phone = kg.phoneNumber || "";
            address = kg.address || "";
          }
          if (searchData.organic?.[0]?.link) {
            targetUrl = searchData.organic[0].link;
          }
        }

        if (!targetUrl) throw new Error("Could not find the company website.");
        send({ type: "progress", message: `🌐 Found website: ${targetUrl}` });

        // Step 2: Crawl website
        send({ type: "progress", message: "🕷️ Crawling website pages..." });
        const crawledContent = await crawl(targetUrl);
        send({ type: "progress", message: `✅ Crawled ${crawledContent.split("--- Page:").length - 1} pages` });

        // Step 3: Search for contact info if not found
        if (!phone || !address) {
          send({ type: "progress", message: "📞 Searching for contact information..." });
          try {
            const domain = new URL(targetUrl).hostname.replace(/^www\./, "");
            const contactSearch = await serperSearch(`${domain} phone number address headquarters`, serperKey, 3);
            const kg2 = contactSearch.knowledgeGraph;
            if (kg2) {
              phone = phone || kg2.phoneNumber || "";
              address = address || kg2.address || "";
            }
          } catch {}
        }

        // Step 4: Search for competitors
        send({ type: "progress", message: "🔎 Researching competitors..." });
        let competitorContext = "";
        try {
          const companyName = query.replace(/https?:\/\/\S+/g, "").trim() || new URL(targetUrl).hostname;
          const compSearch = await serperSearch(`${companyName} top competitors alternatives`, serperKey, 5);
          competitorContext = compSearch.organic?.map((r: any) => `${r.title}: ${r.snippet}`).join("\n") || "";
        } catch {}

        // Step 5: AI Analysis
        send({ type: "progress", message: "🤖 Running AI analysis..." });
        const prompt = `You are a business intelligence analyst. Based on the following crawled website content and search results, generate a comprehensive company research report.

CRAWLED CONTENT:
${crawledContent.slice(0, 8000)}

CONTACT INFO FROM SEARCH:
Phone: ${phone || "Not found"}
Address: ${address || "Not found"}

COMPETITOR RESEARCH FROM SEARCH:
${competitorContext}

Return ONLY a valid JSON object with exactly this structure (no markdown, no explanation):
{
  "companyName": "string",
  "website": "string (the official website URL)",
  "phone": "string (phone number or empty string)",
  "address": "string (full address or empty string)",
  "summary": "string (3-4 sentence company overview)",
  "products": ["string", "string", "string", "string", "string", "string"],
  "painPoints": ["string", "string", "string", "string", "string"],
  "competitors": [
    {"name": "string", "website": "string"},
    {"name": "string", "website": "string"},
    {"name": "string", "website": "string"},
    {"name": "string", "website": "string"},
    {"name": "string", "website": "string"}
  ]
}

Rules:
- products: list 4-6 specific products/services this company actually offers
- painPoints: list 4-5 specific, evidence-based pain points or challenges this company addresses (NOT generic statements)
- competitors: list 5 real competitors in the same country and industry with their actual websites
- website: use "${targetUrl}" as the value
- phone: use "${phone}" if available, otherwise search the crawled content
- address: use "${address}" if available, otherwise search the crawled content`;

        const activeModel = aiModel || "anthropic/claude-sonnet-5";
        const requestPayload = {
          model: activeModel,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        };

        console.log("[OpenRouter] ===== REQUEST DEBUG =====");
        console.log("[OpenRouter] Endpoint: https://openrouter.ai/api/v1/chat/completions");
        console.log("[OpenRouter] Model ID being sent:", activeModel);
        console.log("[OpenRouter] API Key prefix:", openRouterKey ? openRouterKey.slice(0, 12) + "..." : "MISSING");
        console.log("[OpenRouter] Full request body:", JSON.stringify(requestPayload).slice(0, 600));

        let aiRes;
        let errBody = "";
        try {
          console.log("[OpenRouter] Sending request...");
          aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://company-research-assistant.vercel.app",
              "X-Title": "Company Research Assistant",
            },
            body: JSON.stringify(requestPayload),
          });

          console.log("[OpenRouter] Status (Attempt 1):", aiRes.status);
          const bodyText = await aiRes.text();
          console.log("[OpenRouter] Response Body (Attempt 1):", bodyText);

          if (!aiRes.ok) {
            errBody = bodyText;
          } else {
            // It succeeded, parse it
            const aiData = JSON.parse(bodyText);
            const content = aiData.choices?.[0]?.message?.content || "{}";
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const report = JSON.parse(jsonMatch ? jsonMatch[0] : content);
            send({ type: "progress", message: "✅ Report generated successfully!" });
            send({ type: "complete", report: { ...report, website: report.website || targetUrl, phone: report.phone || phone, address: report.address || address } });
            return;
          }
        } catch (e) {
          console.error("[OpenRouter] Exception on Attempt 1:", e);
          errBody = e instanceof Error ? e.message : String(e);
        }

        // If we reach here, Attempt 1 failed. Let's retry without json_object mode
        console.log("[OpenRouter] Retrying without json_object...");
        try {
          const retryPayload = {
            model: activeModel,
            messages: [{ role: "user", content: prompt }],
          };

          const retryRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://company-research-assistant.vercel.app",
              "X-Title": "Company Research Assistant",
            },
            body: JSON.stringify(retryPayload),
          });

          console.log("[OpenRouter] Status (Attempt 2):", retryRes.status);
          const retryBodyText = await retryRes.text();
          console.log("[OpenRouter] Response Body (Attempt 2):", retryBodyText);

          if (!retryRes.ok) {
            throw new Error(`OpenRouter ${retryRes.status}: ${retryBodyText}`);
          }

          const retryData = JSON.parse(retryBodyText);
          const content = retryData.choices?.[0]?.message?.content || "{}";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const report = JSON.parse(jsonMatch ? jsonMatch[0] : content);
          
          send({ type: "progress", message: "✅ Report generated successfully!" });
          send({ type: "complete", report: { ...report, website: report.website || targetUrl, phone: report.phone || phone, address: report.address || address } });
        } catch (e) {
          console.error("[OpenRouter] Exception on Attempt 2:", e);
          throw e; // Bubble up to outer try/catch
        }

      } catch (err: any) {
        send({ type: "error", message: err.message || "An error occurred" });
      } finally {
        try { controller.close(); } catch (e) {}
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
