// Cabeçalho compacto do Plano Estratégico.
import DemoBadge from "@/components/owner/home/DemoBadge";

export default function StrategicHeader() {
  return (
    <section>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
          Planejamento Estratégico
        </h1>
        <DemoBadge />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Acompanhe metas, resultados e evolução dos principais indicadores da empresa.
      </p>
    </section>
  );
}