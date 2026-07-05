"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface SidebarProps {
  onNewResearch: () => void;
  onRequestClose?: () => void;
}

export default function Sidebar({ onNewResearch, onRequestClose }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'API' | 'DISCORD'>('API');

  const [openRouterKey, setOpenRouterKey] = useState("");
  const [serperKey, setSerperKey] = useState("");
  const [aiModel, setAiModel] = useState("anthropic/claude-sonnet-5");
  const [discordToken, setDiscordToken] = useState("");
  const [discordChannel, setDiscordChannel] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setOpenRouterKey(localStorage.getItem("openRouterKey") || "");
    setSerperKey(localStorage.getItem("serperKey") || "");
    setAiModel(localStorage.getItem("aiModel") || "anthropic/claude-sonnet-5");
    setDiscordToken(localStorage.getItem("discordToken") || "");
    setDiscordChannel(localStorage.getItem("discordChannel") || "");
    setApplicantName(localStorage.getItem("applicantName") || "");
    setApplicantEmail(localStorage.getItem("applicantEmail") || "");
  }, []);

  const handleSave = () => {
    localStorage.setItem("openRouterKey", openRouterKey);
    localStorage.setItem("serperKey", serperKey);
    localStorage.setItem("aiModel", aiModel);
    localStorage.setItem("discordToken", discordToken);
    localStorage.setItem("discordChannel", discordChannel);
    localStorage.setItem("applicantName", applicantName);
    localStorage.setItem("applicantEmail", applicantEmail);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-[#1a1a1a] overflow-hidden">

      {/* TOP FIXED SECTION */}
      <div className="flex-shrink-0 p-6 pt-8 pb-4">
        {/* Branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-[#3B82F6] flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 14h6l6-6" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg text-white leading-tight">Relu Consultancy</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Company Intelligence</p>
          </div>
          {onRequestClose && (
            <button
              onClick={onRequestClose}
              aria-label="Close menu"
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* New Research Button */}
        <button
          onClick={onNewResearch}
          className="w-full py-2.5 px-4 rounded-md border border-zinc-800 hover:bg-zinc-900 transition-colors text-sm font-medium text-zinc-300 mb-6 flex items-center justify-center gap-2"
        >
          <span className="text-amber-500">+</span> New Research
        </button>

        {/* Tabs */}
        <div className="flex p-1 bg-zinc-900/50 rounded-lg">
          <button
            onClick={() => setActiveTab('API')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'API' ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            API
          </button>
          <button
            onClick={() => setActiveTab('DISCORD')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'DISCORD' ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            DISCORD
          </button>
        </div>
      </div>

      {/* BOTTOM SCROLLABLE SECTION */}
      <div className="flex-1 overflow-y-auto p-6 pt-2">
        {activeTab === 'API' && (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">OpenRouter API Key</label>
              <input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="sk-or-v1-..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Serper.dev API Key</label>
              <input
                type="password"
                value={serperKey}
                onChange={(e) => setSerperKey(e.target.value)}
                className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="Your Serper key..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">AI Model</label>
              <div className="relative">
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors appearance-none cursor-pointer"
                >
                  <option value="anthropic/claude-sonnet-5">Claude Sonnet 5</option>
                  <option value="anthropic/claude-opus-4.8">Claude Opus 4.8</option>
                  <option value="google/gemini-3.5-flash">Gemini 3.5 Flash</option>
                  <option value="openai/gpt-4.1">GPT-4.1</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-zinc-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <p className="text-[10px] text-zinc-600 mt-1.5">Select your preferred AI model for the report.</p>
            </div>
          </div>
        )}

        {activeTab === 'DISCORD' && (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Discord Token</label>
              <input
                type="password"
                value={discordToken}
                onChange={(e) => setDiscordToken(e.target.value)}
                className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="Bot token..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Channel ID</label>
              <input
                type="text"
                value={discordChannel}
                onChange={(e) => setDiscordChannel(e.target.value)}
                className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
                placeholder="Channel ID..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Applicant Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          className={`w-full mt-6 py-2.5 rounded-md font-semibold text-sm transition-colors shadow-sm ${
            isSaved
              ? 'bg-[#818CF8] text-white hover:bg-[#6366F1]'
              : 'bg-[#FBBF24] hover:bg-[#F59E0B] text-black'
          }`}
        >
          {isSaved ? 'Saved ✓' : 'Save Configuration'}
        </button>

        {/* How it works */}
        <div className="mt-10">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-4">How it works</h3>
          <ul className="space-y-4 text-xs text-zinc-400">
            {[
              "Enter a company name or URL",
              "Serper.dev searches and crawls it",
              "OpenRouter AI generates insights",
              "Download a professional PDF report",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-zinc-800 text-amber-500 flex items-center justify-center font-bold text-[9px]">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 text-center pb-2">
          <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">OpenRouter · Serper.dev · React-PDF</p>
        </div>
      </div>
    </div>
  );
}
