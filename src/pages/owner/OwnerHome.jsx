import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useOwner } from "@/components/owner/OwnerContext";
import DemoBadge from "@/components/owner/home/DemoBadge";
import HomeHeader from "@/components/owner/home/HomeHeader";
import MainIndicators from "@/components/owner/home/MainIndicators";
import PriorityIntervention from "@/components/owner/home/PriorityIntervention";
import SalesGoalBlock from "@/components/owner/home/SalesGoalBlock";
import SecondaryAlerts from "@/components/owner/home/SecondaryAlerts";
import OwnerActionsBlock from "@/components/owner/home/OwnerActionsBlock";
import DepartmentPerformance from "@/components/owner/home/DepartmentPerformance";
import DepartmentDrawer from "@/components/owner/home/DepartmentDrawer";
import ConsultantCard from "@/components/owner/home/ConsultantCard";
import MobileBottomNav from "@/components/owner/home/MobileBottomNav";

export default function OwnerHome() {
  const { openConsultantModal } = useOwner();
  const { setLastUpdated } = useOutletContext();
  const [drawerDept, setDrawerDept] = useState(null);

  useEffect(() => {
    setLastUpdated?.(new Date());
  }, [setLastUpdated]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <DemoBadge />
      <HomeHeader />
      <MainIndicators />

      <PriorityIntervention onTalkToConsultant={openConsultantModal} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SalesGoalBlock />
        <SecondaryAlerts />
        <OwnerActionsBlock />
      </div>

      <DepartmentPerformance onSelectDepartment={setDrawerDept} />

      <ConsultantCard onTalkToConsultant={openConsultantModal} />

      <MobileBottomNav />

      <DepartmentDrawer
        department={drawerDept}
        onClose={() => setDrawerDept(null)}
        onTalkToConsultant={openConsultantModal}
      />
    </div>
  );
}