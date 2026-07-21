// Célula de tabela com tooltip mostrando os valores das outras visualizações (Meta, Resultado Atual, Ano Anterior).
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatCellValue, consolidateValues, SELECTED_MONTH_INDEX, VIEW_OPTIONS } from "./strategicUtils";

const VIEW_DATA_KEY = {
  meta: "targetValues",
  realizado: "currentValues",
  ano_anterior: "previousYearValues",
};

export default function CellWithTooltip({ value, series, monthIndex, currentView, className, isConsolidated = false }) {
  const otherViews = VIEW_OPTIONS.filter((o) => o.value !== currentView);

  const getValueForView = (viewValue) => {
    const arr = series[VIEW_DATA_KEY[viewValue]];
    return isConsolidated
      ? consolidateValues(arr, series.aggregationMode, SELECTED_MONTH_INDEX)
      : arr[monthIndex];
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <td className={className}>
          {formatCellValue(value, series.displayFormat, series.decimalPlaces)}
        </td>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-0.5">
          {otherViews.map((o) => (
            <div key={o.value} className="flex justify-between gap-3">
              <span className="text-primary-foreground/80">{o.label}:</span>
              <span className="font-medium">{formatCellValue(getValueForView(o.value), series.displayFormat, series.decimalPlaces)}</span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}