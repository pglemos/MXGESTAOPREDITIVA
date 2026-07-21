// Badge "Dados fictícios — modelo em validação".
import { Info } from "lucide-react";

export default function DemoBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
      <Info className="h-3.5 w-3.5" />
      Dados fictícios — modelo em validação
    </div>
  );
}