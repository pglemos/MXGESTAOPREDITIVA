import { departments } from "./homeData";
import DepartmentCard from "./DepartmentCard";

export default function DepartmentPerformance({ onSelectDepartment }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-foreground">Desempenho por Departamento</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Scores demonstrativos por área da loja.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <DepartmentCard key={dept.id} department={dept} onClick={() => onSelectDepartment(dept)} />
        ))}
      </div>
    </section>
  );
}