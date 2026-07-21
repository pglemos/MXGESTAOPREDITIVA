import { useState } from "react";
import { Outlet } from "react-router-dom";
import { OwnerProvider } from "@/components/owner/OwnerContext";
import OwnerSidebar from "@/components/owner/OwnerSidebar";
import OwnerTopbar from "@/components/owner/OwnerTopbar";
import ConsultantRequestModal from "@/components/owner/ConsultantRequestModal";
import { X } from "lucide-react";

export default function OwnerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  return (
    <OwnerProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar desktop */}
        <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
          <OwnerSidebar />
        </aside>

        {/* Sidebar mobile (drawer) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 shadow-xl">
              <button
                className="absolute -right-10 top-4 text-white"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6" />
              </button>
              <OwnerSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex min-w-0 flex-1 flex-col">
          <OwnerTopbar onOpenSidebar={() => setMobileOpen(true)} lastUpdated={lastUpdated} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
              <Outlet context={{ setLastUpdated }} />
            </div>
          </main>
        </div>

        {/* Modal global de consultor */}
        <ConsultantRequestModal />
      </div>
    </OwnerProvider>
  );
}