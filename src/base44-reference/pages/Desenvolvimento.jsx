import React from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { SellerPageHeader } from "@/components/seller/SellerPageHeader";
import FeedbackPage from "./FeedbackPage";
import PDIPage from "./PDIPage";

const TABS = [
  { key: "feedback", label: "Feedback" },
  { key: "pdi", label: "PDI" },
];

export default function Desenvolvimento() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") || "feedback";
  const tab = TABS.some(t => t.key === rawTab) ? rawTab : "feedback";

  const setTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  return (
<div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6">
<SellerPageHeader icon={BookOpen} title={tab === "feedback" ? "FEEDBACK" : "PDI"} actions={(
<div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
{TABS.map(t => (
<button
key={t.key}
onClick={() => setTab(t.key)}
className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
tab === t.key
? "bg-white text-blue-700 shadow-sm"
: "text-slate-500 hover:text-slate-700"
}`}
>
{t.label}
</button>
))}
</div>
)} />

<div className="pt-4">
        {tab === "feedback" && <FeedbackPage hideHeader />}
        {tab === "pdi" && <PDIPage hideHeader />}
      </div>
    </div>
  );
}
