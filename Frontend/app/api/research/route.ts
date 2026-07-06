import { NextRequest, NextResponse } from "next/server";
import { crawl } from "../../../lib/crawler/crawl";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const runtime = "edge";

const SERPER_URL = "https://google.serper.dev/search";
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const FALLBACK_MODEL = "anthropic/claude-sonnet-5";

// Module-level cache (persists across requests on a warm Edge instance) so we
// don't re-fetch OpenRouter's ~300-model catalog on every single research request.
let modelCatalogCache: { ids: Set<string>; fetchedAt: number } | null = null;
const MODEL_CATALOG_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getKnownModelIds(): Promise<Set<string> | null> {
  if (modelCatalogCache && Date.now() - modelCatalogCache.fetchedAt < MODEL_CATALOG_TTL_MS) {
    return modelCatalogCache.ids;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(OPENROUTER_MODELS_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return modelCatalogCache?.ids ?? null;
    const data = await res.json();
    const ids = new Set<string>((data.data || []).map((m: any) => m.id));
    modelCatalogCache = { ids, fetchedAt: Date.now() };
    return ids;
  } catch {
    // Catalog fetch failed (network hiccup / timeout) — reuse a previously
    // cached catalog if we have one, otherwise signal "unknown" rather than
    // blocking the whole research request on this side-check.
    return modelCatalogCache?.ids ?? null;
  }
}

// Server-side model validation. This is the piece that makes behavior identical
// across localhost and production regardless of what a given browser origin has
// cached in localStorage: the client-supplied `aiModel` is never trusted blindly,
// it's checked against OpenRouter's live catalog and silently downgraded to a
// known-good default if it doesn't exist (retired, typoed, or stale from an old
// session), instead of being sent straight through to a 404.
async function resolveModel(requestedModel: string | undefined, send: (data: object) => void): Promise<string> {
  const requested = (requestedModel || "").trim() || FALLBACK_MODEL;
  const knownIds = await getKnownModelIds();

  // Couldn't reach the catalog at all — proceed with what was requested rather
  // than second-guessing it off stale/no data; a genuinely bad model will still
  // be caught below by the friendly OpenRouter-error handling.
  if (!knownIds) return requested;

  if (knownIds.has(requested)) return requested;

  send({
    type: "progress",
    message: `⚠️ Model "${requested}" is not currently available on OpenRouter — falling back to ${FALLBACK_MODEL}.`,
  });
  return FALLBACK_MODEL;
}

function friendlyOpenRouterError(status: number, bodyText: string, model: string): string {
  let reason = bodyText;
  try {
    const parsed = JSON.parse(bodyText);
    reason = parsed?.error?.message || bodyText;
  } catch {}

  if (status === 404) {
    return `The AI model "${model}" is not available on OpenRouter (404: model not found). Please pick a different model in Settings — this usually means the model was renamed or retired.`;
  }
  if (status === 401) {
    return `OpenRouter rejected the request (401: invalid API key). Please check the OpenRouter API key saved in Settings.`;
  }
  if (status === 429) {
    return `OpenRouter rate limit reached (429) for "${model}". Please wait a moment or choose a different model.`;
  }
  return `AI analysis failed (OpenRouter ${status} for model "${model}"): ${reason}`;
}

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

// Serper's knowledgeGraph does NOT expose flat `phoneNumber`/`address` fields for
// most companies — that contact data (when Google's panel has it at all) lives
// inside `attributes`, which itself can be either an array of {key, value} pairs
// or a plain object map depending on the entity type. Checking only the flat
// fields means `phone`/`address` come back empty for almost every real result.
function extractContactFromKnowledgeGraph(kg: any): { phone: string; address: string } {
  if (!kg) return { phone: "", address: "" };

  let phone: string = kg.phoneNumber || kg.phone || "";
  let address: string = kg.address || "";

  const attrs = kg.attributes;
  if (attrs) {
    const pairs: [string, string][] = Array.isArray(attrs)
      ? attrs.map((a: any) => [String(a.key || a.attribute || "").toLowerCase(), String(a.value || "")])
      : Object.entries(attrs).map(([k, v]) => [k.toLowerCase(), String(v)]);

    for (const [key, value] of pairs) {
      if (!phone && /phone|contact number|customer service/.test(key)) phone = value;
      if (!address && /address|headquarters|location/.test(key)) address = value;
    }
  }

  return { phone, address };
}

// A domain string ("figma.com") rarely triggers Google's Knowledge Graph company
// panel — searching the clean brand name ("Figma") does, far more reliably.
function guessCompanyName(query: string, targetUrl: string): string {
  if (!isUrl(query)) return query.trim();
  try {
    const host = new URL(targetUrl).hostname.replace(/^www\./, "");
    const base = host.split(".")[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return query;
  }
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
        let contactSnippets = "";

        send({ type: "progress", message: "🔍 Searching for company information..." });

        // Step 1: Resolve website
        if (isUrl(query)) {
          targetUrl = query;
        } else {
          const searchData = await serperSearch(`${query} official website`, serperKey, 3);
          // Try knowledge graph first
          const contact = extractContactFromKnowledgeGraph(searchData.knowledgeGraph);
          phone = contact.phone;
          address = contact.address;
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
            // Searching the brand name ("Figma") reliably attaches Google's Knowledge
            // Graph company panel; searching the bare domain ("figma.com") mostly doesn't.
            const companyNameGuess = guessCompanyName(query, targetUrl);
            const contactSearch = await serperSearch(`${companyNameGuess} headquarters address phone number contact`, serperKey, 5);
            const contact2 = extractContactFromKnowledgeGraph(contactSearch.knowledgeGraph);
            phone = phone || contact2.phone;
            address = address || contact2.address;

            // Fall back to organic snippet text (e.g. LinkedIn/Crunchbase/BBB results
            // often state "headquartered in San Francisco, CA" in plain text) when the
            // Knowledge Graph itself doesn't have the answer.
            if (!phone || !address) {
              const snippetContext = contactSearch.organic?.slice(0, 5)
                .map((r: any) => `${r.title}: ${r.snippet}`).join("\n") || "";
              if (snippetContext) {
                phone = phone || (snippetContext.match(/\+?[\d][\d\s().-]{7,}\d/) || [])[0] || "";
                if (!address) contactSnippets = snippetContext;
              }
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
${contactSnippets ? `\nAdditional search snippets that may mention this company's headquarters/address (check these for an address before giving up):\n${contactSnippets}\n` : ""}
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

        // Validated server-side against OpenRouter's live catalog — this is what
        // makes behavior identical on localhost vs. production even when a given
        // browser's localStorage has a stale/retired model cached: the server
        // never blindly trusts the client-supplied aiModel.
        const activeModel = await resolveModel(aiModel, send);

        const callOpenRouter = (useJsonMode: boolean) => fetch(OPENROUTER_CHAT_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://company-research-assistant.vercel.app",
            "X-Title": "Company Research Assistant",
          },
          body: JSON.stringify({
            model: activeModel,
            messages: [{ role: "user", content: prompt }],
            ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
          }),
        });

        const parseAndSendReport = (bodyText: string) => {
          const aiData = JSON.parse(bodyText);
          const content = aiData.choices?.[0]?.message?.content || "{}";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const report = JSON.parse(jsonMatch ? jsonMatch[0] : content);
          send({ type: "progress", message: "✅ Report generated successfully!" });
          send({ type: "complete", report: { ...report, website: report.website || targetUrl, phone: report.phone || phone, address: report.address || address } });
        };

        console.log("[OpenRouter] Model ID being sent:", activeModel);

        let aiRes = await callOpenRouter(true);
        let bodyText = await aiRes.text();
        console.log("[OpenRouter] Status (Attempt 1):", aiRes.status);

        if (aiRes.ok) {
          parseAndSendReport(bodyText);
          return;
        }

        // Only retry without response_format if the failure actually looks like a
        // structured-output rejection — some models/providers on OpenRouter reject
        // that param outright. For any other failure (bad model, bad key, rate
        // limit) retrying identically would just waste a duplicate round-trip.
        const looksLikeFormatRejection = aiRes.status === 400 &&
          /response_format|json_object|json mode|not support/i.test(bodyText);

        if (looksLikeFormatRejection) {
          send({ type: "progress", message: "Selected model does not support structured output — retrying..." });
          aiRes = await callOpenRouter(false);
          bodyText = await aiRes.text();
          console.log("[OpenRouter] Status (Attempt 2):", aiRes.status);

          if (aiRes.ok) {
            parseAndSendReport(bodyText);
            return;
          }
        }

        console.error("[OpenRouter] Failed:", aiRes.status, bodyText);
        throw new Error(friendlyOpenRouterError(aiRes.status, bodyText, activeModel));

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
