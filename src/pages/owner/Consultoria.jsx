// Página de Consultoria — autonomia assistida com jornada, próximo passo e drawer de encontros.

// Layout em duas colunas: conteúdo principal + barra lateral direita.

import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "@/lib/owner-b44/AuthContext";
import { TrendingUp } from "lucide-react";
import { consultingRepository } from "@/components/owner/consulting/consultingRepository";
import ProgramStatsCard from "@/components/owner/consulting/ProgramStatsCard";
import ProgramSelectorCards from "@/components/owner/consulting/ProgramSelectorCards";
import NextStepCard from "@/components/owner/consulting/NextStepCard";
import MeetingJourney from "@/components/owner/consulting/MeetingJourney";
import CycleFocuses from "@/components/owner/consulting/CycleFocuses";
import ProgramSidebar from "@/components/owner/consulting/ProgramSidebar";
import MeetingDrawer from "@/components/owner/consulting/MeetingDrawer";

export default function Consultoria() {
  const { user } = useAuth();
  const { setLastUpdated } = useOutletContext();
  const [selectedProgramId, setSelectedProgramId] = useState("pmr");
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [initialLessonId, setInitialLessonId] = useState(null);
  const [initialTab, setInitialTab] = useState("content");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLastUpdated?.(new Date());
  }, [setLastUpdated]);

  const clientProgram = consultingRepository.getClientProgram();
  const programs = consultingRepository.getPrograms();
  const program = consultingRepository.getProgram(selectedProgramId);
  const journey = useMemo(() => consultingRepository.getProgramJourney(selectedProgramId), [selectedProgramId]);
  const progressBars = consultingRepository.getProgressBars();
  const nextStep = consultingRepository.getNextClientStep();

  const currentMeeting = useMemo(() => {
    return journey.find((m) => m.id === clientProgram.currentMeetingId) || journey[0] || null;
  }, [journey, clientProgram]);

  const handlePrimaryAction = (step) => {
    if (step.meetingId) {
      setSelectedMeetingId(step.meetingId);
      setInitialLessonId(step.lessonId || null);
      setInitialTab(step.type === "preparation_pending" ? "delivery" : "content");
    }
  };

  const handleDataChange = () => {
    setRefreshKey((k) => k + 1);
  };

  const userRole = user?.role || "owner";

  return (
    <div className="space-y-5 pb-20 lg:pb-0" key={refreshKey}>
      {/* Cabeçalho */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Consultoria</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Acompanhe o plano contratado, encontros e implicações
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <TrendingUp className="h-3.5 w-3.5" />
          Estágio atual: Crescimento
        </span>
      </div>

      {/* Layout em duas colunas */}
      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Conteúdo principal */}
        <div className="flex-1 space-y-5">
          {/* Stats do programa */}
          <ProgramStatsCard
            program={program}
            progressBars={progressBars}
            currentMeeting={currentMeeting}
            onSelectMeeting={setSelectedMeetingId}
          />

          {/* Seletor de programas */}
          <ProgramSelectorCards
            programs={programs}
            selectedProgramId={selectedProgramId}
            onSelectProgram={setSelectedProgramId}
            activeProgramId={clientProgram.programId}
          />

          {/* Jornada de encontros */}
          <MeetingJourney
            meetings={journey}
            onSelectMeeting={setSelectedMeetingId}
            selectedMeetingId={selectedMeetingId}
            userRole={userRole}
            programName={program?.shortName}
          />

          {/* Próximo Passo */}
          <NextStepCard
            step={nextStep}
            onPrimaryAction={handlePrimaryAction}
          />

          {/* Focos atuais do ciclo */}
          <CycleFocuses />
        </div>

      </div>

      {/* Detalhes — rodapé em largura total */}
      <ProgramSidebar
        clientProgram={clientProgram}
        currentMeeting={currentMeeting}
      />

      {/* Drawer do encontro */}
      {selectedMeetingId && (
        <MeetingDrawer
          meetingId={selectedMeetingId}
          onClose={() => { setSelectedMeetingId(null); setInitialLessonId(null); }}
          user={user}
          onDataChange={handleDataChange}
          initialLessonId={initialLessonId}
          initialTab={initialTab}
        />
      )}
    </div>
  );
}