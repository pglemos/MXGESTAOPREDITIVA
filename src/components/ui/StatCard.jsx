import React from "react";

import { KpiCard } from "@/design/components";

const toneMap = {
  blue: "action",
  brand: "teal",
  green: "success",
  success: "success",
  amber: "warning",
  orange: "warning",
  warning: "warning",
  red: "danger",
  danger: "danger",
  navy: "neutral",
  muted: "neutral",
  neutral: "neutral",
};

export default function StatCard({
  label,
  value,
  sublabel,
  icon,
  color,
  tone,
  children,
  active,
  onClick,
}) {
  const Icon = typeof icon === "function" ? icon : null;
  const iconNode = Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : icon;

  return (
    <KpiCard
      label={label}
      value={value}
      sublabel={sublabel}
      icon={iconNode}
      tone={toneMap[tone || color] || "action"}
      active={active}
      onClick={onClick}
    >
      {children}
    </KpiCard>
  );
}
