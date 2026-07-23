import { useState } from "react";
import { Outlet } from "react-router-dom";
import { OwnerProvider } from "@/components/owner/OwnerContext";
import OwnerTopbar from "@/components/owner/OwnerTopbar";
import ConsultantRequestModal from "@/components/owner/ConsultantRequestModal";

export default function OwnerLayout() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  return (
    <OwnerProvider>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
        <OwnerTopbar lastUpdated={lastUpdated} />
        <div
          id="owner-main-content"
          role="region"
          aria-label="Conteúdo do módulo Dono"
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
            <Outlet context={{ setLastUpdated }} />
          </div>
        </div>

        <ConsultantRequestModal />
      </div>
    </OwnerProvider>
  );
}
