import { STATUS_STYLES } from "./homeData";
import ScoreGauge from "./ScoreGauge";
import { ChevronRight } from "lucide-react";

export default function DepartmentCard({ department, onClick }) {
  const style = STATUS_STYLES[department.status];
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border ${style.cardAccent} bg-card p-4 text-left shadow-sm transition-all hover:shadow-md`}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0">
          <ScoreGauge value={department.score} colorClass={style.gauge} variant="circle" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-bold tracking-tight text-foreground">{department.score}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{department.name}</p>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full ${style.bg} ${style.text} px-2 py-0.5 text-xs font-medium`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {style.label}
          </span>
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{department.keyPoint}</p>
        </div>
      </div>
    </button>
  );
}