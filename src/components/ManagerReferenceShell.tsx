import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { SellerLayoutNavItem, SellerLayoutNavSection } from "./SellerSidebar";

type ManagerReferenceShellProps = {
  children: ReactNode;
  navSections: SellerLayoutNavSection[];
};

function isActive(item: SellerLayoutNavItem, pathname: string) {
  const paths = item.activePaths ?? [item.path];
  return paths.some((rawPath) => {
    const path = rawPath.split("?")[0];
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

function ReferenceNavItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: SellerLayoutNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const active = isActive(item, location.pathname);

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-emerald-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
        collapsed && "justify-center",
      )}
    >
      {item.icon && (
        <span
          className={cn(
            "flex h-[18px] w-[18px] shrink-0 items-center justify-center text-gray-400 group-hover:text-gray-600",
            active && "text-white",
          )}
          aria-hidden="true"
        >
          {typeof item.icon === "function"
            ? (() => {
                const Icon = item.icon;
                return <Icon size={18} />;
              })()
            : item.icon}
        </span>
      )}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

/**
 * Shell visual do módulo gerente observado no Base44. Mantém o roteamento
 * canônico do MX, mas não compartilha os elementos escuros do shell vendedor.
 */
export default function ManagerReferenceShell({
  children,
  navSections,
}: ManagerReferenceShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navSections.flatMap((section) => section.items);

  const navigation = (compact = false, closeMobile?: () => void) => (
    <nav
      className={cn(
        "flex-1 space-y-0.5 overflow-y-auto px-2 py-4",
        compact && "pt-3",
      )}
      aria-label="Menu principal do Gerente"
    >
      {items.map((item) => (
        <ReferenceNavItem
          key={item.path}
          item={item}
          collapsed={collapsed && !compact}
          onNavigate={closeMobile}
        />
      ))}
    </nav>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50 font-sans text-gray-800">
      <aside
        aria-label="Menu principal do Gerente"
        className={cn(
          "hidden shrink-0 flex-col border-r border-gray-100 bg-white shadow-sm transition-all duration-200 lg:flex",
          collapsed ? "w-16" : "w-56",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 border-b border-gray-100 px-4 py-5",
            collapsed && "justify-center",
          )}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
            MX
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-sm font-bold leading-tight text-gray-800">
                MX Performance
              </span>
              <span className="block text-xs font-medium text-emerald-600">
                Módulo Gerencial
              </span>
            </span>
          )}
        </div>
        {navigation()}
        <div className="hidden px-2 pb-4 lg:block">
          <button
            type="button"
            aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
            onClick={() => setCollapsed((value) => !value)}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-600"
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Recolher</span></>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 shadow-sm lg:hidden">
          <button
            type="button"
            aria-label="Abrir menu principal"
            onClick={() => setMobileOpen(true)}
            className="text-gray-500 transition-colors hover:text-gray-700"
          >
            <Menu size={22} />
          </button>
          <span className="grid h-6 w-6 place-items-center rounded bg-emerald-600 text-xs font-bold text-white">MX</span>
          <span className="text-sm font-semibold text-gray-800">MX Performance</span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[120] flex lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu principal"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 cursor-default bg-black/30"
          />
          <aside className="relative z-10 flex w-64 flex-col bg-white shadow-xl">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <div className="border-b border-gray-100 px-4 py-5">
              <p className="text-sm font-bold text-gray-800">MX Performance</p>
              <p className="text-xs font-medium text-emerald-600">Módulo Gerencial</p>
            </div>
            {navigation(true, () => setMobileOpen(false))}
          </aside>
        </div>
      )}
    </div>
  );
}
