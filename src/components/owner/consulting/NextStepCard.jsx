// Card "Próximo Passo" — exibe dinamicamente a próxima atividade que depende do cliente.

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, CheckCircle2, Clock, Calendar, FileText, Users, ListChecks, ArrowRight } from "lucide-react";

const ICON_MAP = {
  play: Play,
  check: CheckCircle2,
  clock: Clock,
  calendar: Calendar,
  evidence: FileText,
  participants: Users,
  checklist: ListChecks,
};

export default function NextStepCard({ step, onPrimaryAction }) {
  if (!step) return null;

  const Icon = ICON_MAP[step.icon] || Play;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-primary/5 px-4 py-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="text-sm font-medium text-foreground">{step.content}</p>
          {step.lessonTitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{step.lessonTitle}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{step.info}</p>
        </div>

        {step.progressLabel && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{step.progressLabel}</span>
              {step.progress !== undefined && step.progress > 0 && (
                <span className="font-medium text-foreground">{Math.round(step.progress)}%</span>
              )}
            </div>
            {step.progress !== undefined && step.progress > 0 && (
              <Progress value={step.progress} className="h-1.5" />
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            className="flex-1"
            onClick={() => onPrimaryAction(step)}
          >
            {step.primaryButton}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}