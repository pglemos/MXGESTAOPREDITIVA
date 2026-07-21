// Exportação CSV das ações da Visão Executiva.
import { getObjectiveLabel, getPriorityLabel, getStatusLabel, DEPT_STYLES } from "./actionPlanConstants";
import { isLate, daysLate } from "./actionPlanUtils";

function downloadFile(filename, content) {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportActionsCSV(actions) {
  const headers = [
    "Código", "Título", "Objetivo", "Departamento", "Indicador",
    "Responsável", "Prioridade", "Status", "Progresso", "Prazo",
    "Atraso", "Impacto esperado",
  ];

  const rows = actions.map((a) => {
    const dept = DEPT_STYLES[a.department]?.label || a.department;
    const late = isLate(a);
    return [
      a.code,
      a.title,
      getObjectiveLabel(a.strategicObjective),
      dept,
      a.indicator || "—",
      a.responsible,
      getPriorityLabel(a.priority),
      getStatusLabel(a.status),
      `${a.progress}%`,
      a.dueDate || "—",
      late ? `${daysLate(a)} dias` : "—",
      a.expectedImpact || "—",
    ];
  });

  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  downloadFile("plano-de-acao-visao-executiva-2026.csv", csv);
}