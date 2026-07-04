import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAX_PAGES = 6;
const REQUEST_TIMEOUT_MS = 8000;
const HIGH_VALUE_PATHS = ["/about", "/about-us", "/contact", "/contact-us", "/products", "/services", "/solutions", "/pricing", "/team", "/company"];

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hostname = u.hostname.replace(/^www\./, "");
    u.hash = "";
    let p = u.pathname.replace(/\/+$/, "") || "/";
    return u.origin.replace(/^https?:\/\/www\./, "https://") + p;
  } catch {
    return url;
  }
}

function shouldSkip(url: string): boolean {
  const skipPatterns = [
    /\.(jpg|jpeg|png|gif|svg|webp|ico|pdf|zip|mp4|mp3|woff|woff2|ttf|css|js)(\?|$)/i,
    /\/(login|signin|signup|register|cart|checkout|privacy|terms|cookie|cdn-cgi|wp-admin|feed|tag|author)\b/i,
    /#/,
  ];
  return skipPatterns.some((p) => p.test(url));
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CompanyResearchBot/1.0)" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    try {
      const href = $(el).attr("href") || "";
      const abs = new URL(href, baseUrl).toString();
      const target = new URL(abs);
      if (target.hostname.replace(/^www\./, "") === base.hostname.replace(/^www\./, "")) {
        links.push(abs);
      }
    } catch {}
  });
  return links;
}

function extractText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript, iframe, svg").remove();
  return $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000);
}

export async function crawl(startUrl: string): Promise<string> {
  const visited = new Set<string>();
  const queue: { url: string; depth: number }[] = [];
  const results: string[] = [];

  // Prioritize high-value pages
  const base = new URL(startUrl);
  for (const path of HIGH_VALUE_PATHS) {
    queue.push({ url: base.origin + path, depth: 1 });
  }
  queue.push({ url: startUrl, depth: 0 });

  while (queue.length > 0 && results.length < MAX_PAGES) {
    const item = queue.shift()!;
    const norm = normalizeUrl(item.url);

    if (visited.has(norm) || shouldSkip(item.url)) continue;
    visited.add(norm);

    const html = await fetchPage(item.url);
    if (!html) continue;

    const text = extractText(html);
    if (text.length > 100) {
      results.push(`--- Page: ${item.url} ---\n${text}`);
    }

    if (item.depth < 2) {
      const links = extractLinks(html, item.url);
      for (const link of links) {
        const ln = normalizeUrl(link);
        if (!visited.has(ln) && !shouldSkip(link)) {
          queue.push({ url: link, depth: item.depth + 1 });
        }
      }
    }
  }

  return results.join("\n\n");
}
