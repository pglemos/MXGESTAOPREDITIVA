// Guia de transições — mostra regras de cada transição permitida.
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TRANSITION_RULES, ACTION_STATUSES, KANBAN_COLUMNS } from "../actionPlanConstants";

const REQUIREMENTS = {
  approve: ["Decisão do Dono", "Observação (opcional)", "Responsável", "Prazo", "Orçamento (se houver)"],
  block: ["Motivo", "Categoria", "Responsável pela resolução", "Previsão de desbloqueio"],
  submitValidation: ["Progresso 100%", "Checklist obrigatório concluído", "Evidência (quando obrigatória)", "Sem bloqueios"],
  unblock: ["Solução aplicada", "Responsável", "Observação"],
  validate: ["Decisão", "Observação", "Classificação inicial do impacto", "Valor antes/depois (opcional)"],
  return: ["Motivo da devolução", "Orientação", "Responsável", "Novo prazo (opcional)"],
};

const WHO_CAN = {
  approve: "Dono",
  block: "Responsável ou Dono",
  submitValidation: "Responsável",
  unblock: "Responsável ou Dono",
  validate: "Dono",
  return: "Dono",
  direct: "Responsável",
};

export default function TransitionGuideModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Guia de transições</DialogTitle>
          <DialogDescription>
            Regras para movimentar ações entre status no quadro.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {KANBAN_COLUMNS.map((col) => {
            const rules = TRANSITION_RULES[col.value] || {};
            const destinations = Object.keys(rules);
            if (destinations.length === 0) {
              return (
                <div key={col.value} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold text-foreground">{col.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Não permite movimentação direta. Use as ações rápidas (Reabrir, Duplicar, etc.).</p>
                </div>
              );
            }
            return (
              <div key={col.value} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-foreground">{col.label}</p>
                <div className="mt-2 space-y-2">
                  {destinations.map((dest) => {
                    const rule = rules[dest];
                    const destLabel = ACTION_STATUSES.find((s) => s.value === dest)?.label || dest;
                    const reqs = rule.direct ? ["Transição direta (sem modal)"] : REQUIREMENTS[rule.modal] || [];
                    return (
                      <div key={dest} className="rounded-md bg-muted/40 p-2">
                        <p className="text-xs font-medium text-foreground">→ {destLabel}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="font-medium">Requisitos:</span> {reqs.join("; ")}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="font-medium">Quem executa:</span> {rule.direct ? WHO_CAN.direct : WHO_CAN[rule.modal] || "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}