// Container da Visão Executiva — orquestra todas as seções.
import CycleSummary from "./CycleSummary";
import NeedsOwnerSection from "./NeedsOwnerSection";
import ObjectiveExecution from "./ObjectiveExecution";
import DepartmentExecution from "./DepartmentExecution";
import RiskActions from "./RiskActions";
import UpcomingDeadlines from "./UpcomingDeadlines";
import RecentlyCompleted from "./RecentlyCompleted";

export default function ExecutiveView({
  actions,
  onAnalyze,
  onApprove,
  onDelegate,
  onTalkToConsultant,
  onFilterByObjective,
  onFilterByDepartment,
  activeObjective,
  activeDepartment,
}) {
  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma ação encontrada para os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile order: Precisam de você → Resumo → Risco → Prazos → Objetivos → Departamentos → Concluídas */}
      <div className="space-y-4 lg:space-y-0">
        {/* Precisam de você — first on mobile, left on desktop */}
        <NeedsOwnerSection
          actions={actions}
          onAnalyze={onAnalyze}
          onApprove={onApprove}
          onDelegate={onDelegate}
          onTalkToConsultant={onTalkToConsultant}
        />
      </div>

      <CycleSummary actions={actions} />

      {/* Risk + Deadlines — two columns on desktop */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RiskActions actions={actions} onOpen={onAnalyze} />
        <UpcomingDeadlines actions={actions} onOpen={onAnalyze} />
      </div>

      {/* Objectives + Departments */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ObjectiveExecution
          actions={actions}
          onFilterByObjective={onFilterByObjective}
          activeObjective={activeObjective}
        />
        <DepartmentExecution
          actions={actions}
          onFilterByDepartment={onFilterByDepartment}
          activeDepartment={activeDepartment}
        />
      </div>

      <RecentlyCompleted actions={actions} onOpen={onAnalyze} />
    </div>
  );
}