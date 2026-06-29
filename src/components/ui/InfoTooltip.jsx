import React, { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

export default function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!visible) return undefined;

    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setVisible(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setVisible(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible]);

  const rect = ref.current?.getBoundingClientRect();

  return (
    <span ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onClick={() => setVisible((current) => !current)}
        className="rounded-full text-mx-muted transition-colors duration-[120ms] hover:text-mx-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action"
        aria-label="Mais informações"
        aria-describedby={visible ? tooltipId : undefined}
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className="fixed z-[9999] w-[280px] rounded-[12px] border border-mx-border bg-white px-3.5 py-3 text-left text-[12px] leading-relaxed text-mx-muted shadow-popover"
          style={{
            top: rect ? rect.bottom + 6 : 0,
            left: rect ? Math.min(rect.left, window.innerWidth - 296) : 0,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
