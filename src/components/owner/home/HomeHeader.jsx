import { greetingByHour } from "@/lib/owner-b44/format";
import { useOwner } from "@/components/owner/OwnerContext";
import { CalendarRange } from "lucide-react";

export default function HomeHeader() {
  const { user } = useOwner();
  const firstName = (user?.full_name || "Davi").split(" ")[0];

  return (
    <section>
      <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
        {greetingByHour()}, {firstName}! 👋
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Aqui está o panorama da sua loja hoje.</p>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground">
        <CalendarRange className="h-4 w-4 text-muted-foreground" />
        Julho/2026
      </div>
    </section>
  );
}