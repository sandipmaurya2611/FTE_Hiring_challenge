"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";
import EmptyState from "../components/EmptyState";
import GeneratingState from "../components/GeneratingState";
import ReportDashboard from "../components/ReportDashboard";
import { ReportData } from "../types";

export default function Home() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNewResearch = () => {
    setReport(null);
    setIsGenerating(false);
    setProgress([]);
    setErrorMsg("");
  };

  const handleStartResearch = async (query: string) => {
    if (!query.trim()) return;

    const openRouterKey = localStorage.getItem("openRouterKey") || "";
    const serperKey = localStorage.getItem("serperKey") || "";
    const aiModel = localStorage.getItem("aiModel") || "anthropic/claude-3.5-sonnet";

    if (!openRouterKey || !serperKey) {
      setErrorMsg("Please save your OpenRouter and Serper.dev API keys in the sidebar first.");
      setTimeout(() => setErrorMsg(""), 5000);
      return;
    }

    setIsGenerating(true);
    setReport(null);
    setProgress([]);
    setErrorMsg("");

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, openRouterKey, serperKey, aiModel }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "progress") {
                setProgress(prev => [...prev, data.message]);
              } else if (data.type === "complete") {
                setReport(data.report);
                setIsGenerating(false);
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error("Error parsing stream data:", e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "An unexpected error occurred.");
      setIsGenerating(false);
    }
  };

  return (
    <main className="flex min-h-screen max-h-screen bg-[#000000] text-[#ededed] overflow-hidden font-sans relative">

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <section
        className={`fixed inset-y-0 left-0 w-80 min-w-[320px] flex-shrink-0 z-40 transition-transform duration-300 ease-in-out
          md:static md:z-10 md:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar onNewResearch={handleNewResearch} onRequestClose={() => setIsSidebarOpen(false)} />
      </section>

      {/* Right Main Content */}
      <section className="flex-1 flex flex-col relative overflow-hidden bg-[#000000] w-full">

        {/* Top Header Bar */}
        <div className="h-16 flex items-center gap-3 px-4 md:px-8 border-b border-[#1a1a1a] flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-900 transition-colors flex-shrink-0"
          >
            <Menu size={18} />
          </button>
          <h2 className="font-semibold text-sm text-white flex items-center gap-3">
            <span className="hidden sm:inline">Company Research</span>
            <span className="sm:hidden">Research</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[9px] uppercase tracking-widest font-bold">
              ● Live
            </span>
          </h2>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col relative">

          {errorMsg && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-red-950 border border-red-800 text-red-300 px-4 py-2 rounded-lg text-sm shadow-xl">
              {errorMsg}
            </div>
          )}

          {!report && !isGenerating && (
            <EmptyState onSubmit={handleStartResearch} />
          )}

          {isGenerating && !report && (
            <GeneratingState progress={progress} />
          )}

          {report && !isGenerating && (
            <ReportDashboard report={report} />
          )}
        </div>

        {/* Global Floating Search Bar (Claude Style) */}
        {!isGenerating && (
          <div className="absolute bottom-0 left-0 right-0 pt-10 pb-6 md:pb-8 px-4 md:px-12 z-20 pointer-events-none bg-gradient-to-t from-[#000000] via-[#000000] to-transparent">
            <form
              onSubmit={(e) => { e.preventDefault(); handleStartResearch((e.currentTarget as any).search.value); setIsSidebarOpen(false); }}
              className="max-w-3xl mx-auto relative group pointer-events-auto"
            >
              <input
                name="search"
                type="text"
                placeholder="Company name or website URL..."
                className="w-full bg-[#111111] border border-zinc-800 rounded-xl pl-4 md:pl-6 pr-24 md:pr-32 py-3.5 md:py-4 text-sm text-white focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all shadow-[0_0_40px_rgba(0,0,0,0.8)]"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-3.5 md:px-5 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-semibold text-sm rounded-lg flex items-center gap-2 transition-colors"
              >
                Research
              </button>
            </form>
            <div className="text-center mt-3 md:mt-4 pointer-events-auto hidden sm:block">
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                Enter to research · Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </section>

    </main>
  );
}
