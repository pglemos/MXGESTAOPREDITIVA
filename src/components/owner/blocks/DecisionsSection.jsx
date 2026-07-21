import { useState } from "react";
import DecisionCard from "@/components/owner/blocks/DecisionCard";
import {
  DecisionAnalyzeDrawer,
  ApproveDecisionModal,
  DelegateDecisionModal,
  ConvertToActionModal,
} from "@/components/owner/blocks/DecisionModals";
import { useOwner } from "@/components/owner/OwnerContext";
import EmptyState from "@/components/owner/EmptyState";
import { CheckCircle2 } from "lucide-react";

export default function DecisionsSection({ decisions, loading, onReload }) {
  const { openConsultantModal } = useOwner();
  const [active, setActive] = useState(null); // { type, decision }

  const openModal = (type, decision) => setActive({ type, decision });
  const close = () => setActive(null);

  const handleDone = async () => {
    close();
    await onReload?.();
  };

  const talkConsultant = (decision) => {
    openConsultantModal({
      title: decision.title,
      contextType: "decision",
      contextId: decision.id,
      requestType: "decision_discussion",
      priority: decision.impact_level === "high" ? "high" : "medium",
      snapshot: `Decisão: ${decision.title}\nDepartamento: ${decision.department}\nPrazo: ${decision.due_date}\nImpacto: ${decision.impact_level}\nContexto: ${decision.context}`,
    });
  };

  const list = decisions.slice(0, 3);

  return (
    <section className="order-2 lg:order-3">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Decisões que precisam de você hoje</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Prioridades que dependem de aprovação, direção ou intervenção do Dono.
          </p>
        </div>
        {decisions.length > 3 && (
          <span className="hidden text-xs text-muted-foreground/80 sm:block">+{decisions.length - 3} outras pendentes</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Nenhuma decisão pendente para hoje</p>
            <p className="text-xs text-muted-foreground">Novas decisões aparecerão aqui quando precisarem de você.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {list.map((d) => (
            <DecisionCard key={d.id} decision={d} onAction={openModal} />
          ))}
        </div>
      )}

      {/* Drawer de análise */}
      <DecisionAnalyzeDrawer
        decision={active?.type === "analyze" ? active.decision : null}
        open={active?.type === "analyze"}
        onOpenChange={(o) => !o && close()}
        onConsultant={talkConsultant}
      />

      {/* Modal aprovar */}
      <ApproveDecisionModal
        decision={active?.type === "approve" ? active.decision : null}
        open={active?.type === "approve"}
        onOpenChange={(o) => !o && close()}
        onDone={handleDone}
      />

      {/* Modal delegar */}
      <DelegateDecisionModal
        decision={active?.type === "delegate" ? active.decision : null}
        open={active?.type === "delegate"}
        onOpenChange={(o) => !o && close()}
        onDone={handleDone}
      />

      {/* Modal transformar em ação */}
      <ConvertToActionModal
        decision={active?.type === "convert" ? active.decision : null}
        open={active?.type === "convert"}
        onOpenChange={(o) => !o && close()}
        onDone={handleDone}
      />
    </section>
  );
}