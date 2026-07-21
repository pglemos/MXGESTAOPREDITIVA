// Minigráfico SVG — linha ou barra — para os cards executivos.
export default function MiniChart({ data, colorClass = "text-primary", type = "line" }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  if (type === "bar") {
    const slotWidth = 100 / data.length;
    const barWidth = slotWidth * 0.6;
    return (
      <svg viewBox="0 0 100 30" className="h-8 w-full" preserveAspectRatio="none">
        {data.map((v, i) => {
          const x = i * slotWidth + (slotWidth - barWidth) / 2;
          const height = ((v - min) / range) * 24;
          return (
            <rect
              key={i}
              x={x}
              y={28 - height}
              width={barWidth}
              height={height}
              fill="currentColor"
              className={colorClass}
              rx="1"
            />
          );
        })}
      </svg>
    );
  }

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