// Modo Foco — visualização inicial e mais intuitiva para o Dono.
import { Button } from "@/components/ui/button";
import FocusNeedsYou from "./FocusNeedsYou";
import FocusAtRisk from "./FocusAtRisk";
import FocusInProgress from "./FocusInProgress";
import FocusAwaitingValidation from "./FocusAwaitingValidation";
import FocusRecentlyCompleted from "./FocusRecentlyCompleted";

export default function FocusView({
  actions,
  activeCard,
  onAnalyze,
  onApprove,
  onDelegate,
  onTalkToConsultant,
  onQuickAction,
  onClearFilters,
  onNewAction,
}) {
  if (!actions || actions.length === 0) {
    let message = "Nenhuma ação encontrada nesta condição.";
    if (activeCard === "late") message = "Nenhuma ação atrasada. O plano está dentro dos prazos.";
    else if (activeCard === "not_started") message = "Todas as ações previstas já foram iniciadas.";
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={onClearFilters}>Limpar filtro</Button>
          <Button onClick={onNewAction} className="bg-primary hover:bg-primary/90">Nova Ação</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FocusNeedsYou
        actions={actions}
        onAnalyze={onAnalyze}
        onApprove={onApprove}
        onDelegate={onDelegate}
        onTalkToConsultant={onTalkToConsultant}
      />
      <FocusAtRisk actions={actions} onOpen={onAnalyze} />
      <FocusInProgress actions={actions} onOpen={onAnalyze} onQuickAction={onQuickAction} />
      <FocusAwaitingValidation actions={actions} onValidate={onQuickAction} />
      <FocusRecentlyCompleted actions={actions} onOpen={onAnalyze} />
    </div>
  );
}