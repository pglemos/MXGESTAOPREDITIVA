import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import FeedbackPage from "./FeedbackPage";
import PDIPage from "./PDIPage";

const TABS = [
  { key: "feedback", label: "Feedback" },
  { key: "pdi", label: "PDI" },
];

export default function Desenvolvimento() {
  const [tab, setTab] = useState("feedback");

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header com abas */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3 h-[64px]">
          <BookOpen className="w-5 h-5 text-mx-blue" />
          <h1 className="text-[18px] sm:text-[22px] font-black text-[#0F172A] uppercase tracking-tight">Desenvolvimento</h1>
        </div>
        <div className="flex gap-1 -mb-px">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.key
                  ? "border-mx-blue text-mx-blue"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {tab === "feedback" && <FeedbackPage />}
        {tab === "pdi" && <PDIPage />}
      </div>
    </div>
  );
}