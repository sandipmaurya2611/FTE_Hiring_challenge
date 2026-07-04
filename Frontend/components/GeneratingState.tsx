"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface GeneratingStateProps {
  progress: string[];
}

export default function GeneratingState({ progress }: GeneratingStateProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [progress]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center pb-16 px-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Loader2 size={18} className="text-[#FBBF24] animate-spin flex-shrink-0" />
          <h3 className="text-sm font-semibold text-white">Researching...</h3>
        </div>
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 font-mono text-xs space-y-2 max-h-96 overflow-y-auto">
          {progress.length === 0 && (
            <p className="text-zinc-600">Initializing research pipeline...</p>
          )}
          {progress.map((msg, i) => (
            <p key={i} className="text-zinc-400">
              <span className="text-emerald-500 mr-2">▶</span>{msg}
            </p>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
