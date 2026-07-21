import { useState } from "react";
import { Info } from "lucide-react";
import ScoreGauge from "./ScoreGauge";
import { mxScore, STATUS_STYLES } from "./homeData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function MxScoreCard() {
  const [open, setOpen] = useState(false);
  const style = STATUS_STYLES[mxScore.status];

  return (
    <div className={`rounded-xl border ${style.cardAccent} bg-card p-4 shadow-sm`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">MX Score da Loja</p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground" aria-label="Informação do score">
              <Info className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="max-w-xs text-xs text-muted-foreground">{mxScore.infoText}</PopoverContent>
        </Popover>
      </div>
      <div className="relative mx-auto mt-2 h-[100px] w-[100px]">
        <ScoreGauge value={mxScore.value} colorClass={style.gauge} variant="circle" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-foreground">{mxScore.value}</span>
          <span className={`text-xs font-medium ${style.text}`}>{mxScore.classification}</span>
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-medium text-primary">{mxScore.trend}</p>
    </div>
  );
}