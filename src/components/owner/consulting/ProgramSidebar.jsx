// Barra lateral direita — detalhes do programa.

import { Users, User, Calendar } from "lucide-react";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function ProgramSidebar({ clientProgram, currentMeeting }) {
  const participantRoles = currentMeeting?.participants?.map((p) => p.role).join(", ") || "—";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Detalhes</h3>
        <div className="mt-3 space-y-2.5 text-xs">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Consultor:</span>
            <span className="font-medium text-foreground">{clientProgram?.consultantName || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Participantes:</span>
            <span className="font-medium text-foreground">{participantRoles}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Início:</span>
            <span className="font-medium text-foreground">{formatDate(clientProgram?.startDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}