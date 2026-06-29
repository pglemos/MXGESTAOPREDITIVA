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

function renderIcon(icon) {
  if (!icon) return null;

  if (React.isValidElement(icon)) {
    return React.cloneElement(icon, {
      className: ["h-5 w-5", icon.props.className].filter(Boolean).join(" "),
      "aria-hidden": true,
      focusable: false,
    });
  }

  if (typeof icon === "function" || (typeof icon === "object" && icon.$$typeof)) {
    return React.createElement(icon, {
      className: "h-5 w-5",
      "aria-hidden": true,
      focusable: false,
    });
  }

  return icon;
}

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
  return (
    <KpiCard
      label={label}
      value={value}
      sublabel={sublabel}
      icon={renderIcon(icon)}
      tone={toneMap[tone || color] || "action"}
      active={active}
      onClick={onClick}
    >
      {children}
    </KpiCard>
  );
}
