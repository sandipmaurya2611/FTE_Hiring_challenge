"use client";

interface EmptyStateProps {
  onSubmit: (query: string) => void;
}

export default function EmptyState({ onSubmit }: EmptyStateProps) {
  const examples = [
    "Microsoft",
    "Stripe",
    "https://figma.com",
    "OpenAI",
    "Tesla",
    "https://notion.so",
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center pb-40 text-center px-4">
      <div className="mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#3B82F6] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-950/40">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 14h6l6-6" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Company Intelligence</h2>
        <p className="text-zinc-500 text-sm max-w-md mx-auto">
          Enter any company name or website URL below to get a full AI-powered research report with competitor analysis.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onSubmit(ex)}
            className="px-3 py-1.5 rounded-full border border-zinc-800 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors bg-[#0a0a0a]"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
