// Submenu "Mover para..." — mostra destinos permitidos pelo status atual.
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArrowRightLeft } from "lucide-react";
import { TRANSITION_RULES, ACTION_STATUSES } from "../actionPlanConstants";

export default function MoveToMenu({ action, onMoveTo }) {
  const rules = TRANSITION_RULES[action.status] || {};
  const destinations = Object.keys(rules)
    .map((dest) => ({
      dest,
      label: ACTION_STATUSES.find((s) => s.value === dest)?.label || dest,
    }));

  if (destinations.length === 0) return null;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <ArrowRightLeft className="h-3.5 w-3.5" />
        Mover para...
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {destinations.map(({ dest, label }) => (
          <DropdownMenuItem key={dest} onClick={() => onMoveTo(action, dest)}>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}