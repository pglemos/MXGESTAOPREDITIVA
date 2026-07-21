// Mini gráfico de linha (sparkline) em SVG — demonstrativo.
export default function Sparkline({ data, colorClass = "text-primary" }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 28 - ((v - min) / range) * 24 - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 30" className="h-8 w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={colorClass}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}