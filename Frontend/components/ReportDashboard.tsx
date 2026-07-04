"use client";

import { useRef, useState } from "react";
import { Download, ExternalLink, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { ReportData } from "../types";

interface ReportDashboardProps {
  report: ReportData;
}

export default function ReportDashboard({ report }: ReportDashboardProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [discordMsg, setDiscordMsg] = useState("");

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.companyName.replace(/\s+/g, "_")}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      // Auto-send to Discord after download
      const discordToken = localStorage.getItem("discordToken");
      const discordChannel = localStorage.getItem("discordChannel");
      const applicantName = localStorage.getItem("applicantName");
      const applicantEmail = localStorage.getItem("applicantEmail");

      if (discordToken && discordChannel) {
        setDiscordStatus("sending");
        try {
          const pdfRes = await fetch("/api/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ report }),
          });
          const pdfBlob = await pdfRes.blob();
          const pdfBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
            reader.readAsDataURL(pdfBlob);
          });

          const discordRes = await fetch("/api/discord", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              discordToken,
              discordChannel,
              applicantName: applicantName || "Unknown",
              applicantEmail: applicantEmail || "Unknown",
              companyName: report.companyName,
              companyWebsite: report.website,
              pdfBase64,
              fileName: `${report.companyName.replace(/\s+/g, "_")}_report.pdf`,
            }),
          });

          if (discordRes.ok) {
            setDiscordStatus("sent");
            setDiscordMsg("Report sent to Discord!");
          } else {
            throw new Error("Discord API error");
          }
        } catch {
          setDiscordStatus("error");
          setDiscordMsg("Failed to send to Discord.");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full pb-48 animate-in fade-in zoom-in-95 duration-500 mt-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 md:p-8 shadow-2xl relative" ref={reportRef}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-bold text-[#FBBF24] uppercase tracking-widest mb-1">Company Intelligence Report</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">{report.companyName}</h2>
            {report.website && (
              <a href={report.website} target="_blank" rel="noopener noreferrer"
                className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mt-1 transition-colors">
                {report.website} <ExternalLink size={11} />
              </a>
            )}
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FBBF24] hover:bg-[#F59E0B] disabled:opacity-60 text-black font-semibold text-sm rounded-lg transition-colors flex-shrink-0 shadow-lg"
          >
            {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {pdfLoading ? "Generating..." : "Download PDF Report"}
          </button>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <div className="bg-[#111111] rounded-lg p-4 border border-[#1e1e1e]">
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Phone</p>
            <p className="text-sm text-zinc-300">{report.phone || "Not available"}</p>
          </div>
          <div className="bg-[#111111] rounded-lg p-4 border border-[#1e1e1e]">
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Address</p>
            <p className="text-sm text-zinc-300">{report.address || "Not available"}</p>
          </div>
        </div>

        {/* Summary */}
        {report.summary && (
          <div className="mb-8">
            <h3 className="text-[10px] font-bold text-[#FBBF24] uppercase tracking-widest mb-3">Company Summary</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">{report.summary}</p>
          </div>
        )}

        {/* Products */}
        {report.products?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[10px] font-bold text-[#FBBF24] uppercase tracking-widest mb-3">Products & Services</h3>
            <div className="flex flex-wrap gap-2">
              {report.products.map((p, i) => (
                <span key={i} className="px-3 py-1.5 bg-[#111111] border border-[#1e1e1e] rounded-full text-xs text-zinc-300">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pain Points */}
        {report.painPoints?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[10px] font-bold text-[#FBBF24] uppercase tracking-widest mb-3">AI-Generated Pain Points</h3>
            <ul className="space-y-2">
              {report.painPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] flex-shrink-0 mt-1.5" />
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Competitors */}
        {report.competitors?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[10px] font-bold text-[#FBBF24] uppercase tracking-widest mb-3">Competitors</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {report.competitors.map((c, i) => (
                <div key={i} className="bg-[#111111] border border-[#1e1e1e] rounded-lg p-4">
                  <p className="text-sm font-semibold text-white mb-1">{c.name}</p>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 truncate block transition-colors">
                      {c.website}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discord Status */}
        {discordStatus !== "idle" && (
          <div className={`flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg border ${
            discordStatus === "sent" ? "bg-emerald-950 border-emerald-800 text-emerald-400" :
            discordStatus === "error" ? "bg-red-950 border-red-800 text-red-400" :
            "bg-zinc-900 border-zinc-800 text-zinc-400"
          }`}>
            {discordStatus === "sending" && <Loader2 size={14} className="animate-spin" />}
            {discordStatus === "sent" && <CheckCircle2 size={14} />}
            {discordStatus === "error" && <AlertCircle size={14} />}
            {discordMsg || "Sending to Discord..."}
          </div>
        )}
      </div>
    </div>
  );
}
