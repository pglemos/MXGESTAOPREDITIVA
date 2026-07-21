import { Button } from "@/components/ui/button";
import { MessageCircle, Settings } from "lucide-react";

export default function EmptyState({ title, description, onConfigure, onTalkToConsultant }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-md text-xs text-muted-foreground">{description}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {onConfigure && (
          <Button size="sm" variant="outline" onClick={onConfigure}>
            <Settings className="h-3.5 w-3.5" />
            Configurar dados
          </Button>
        )}
        {onTalkToConsultant && (
          <Button size="sm" variant="default" onClick={onTalkToConsultant}>
            <MessageCircle className="h-3.5 w-3.5" />
            Falar com Consultor
          </Button>
        )}
      </div>
    </div>
  );
}