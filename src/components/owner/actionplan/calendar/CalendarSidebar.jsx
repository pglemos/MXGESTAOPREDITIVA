// Lateral do Calendário — próximos prazos, resumo, detalhes do dia.
import UpcomingDeadlines from "./UpcomingDeadlines";
import CalendarSummary from "./CalendarSummary";
import DayDetails from "./DayDetails";

export default function CalendarSidebar({
  actions,
  selectedDate,
  selectedAction,
  onSelectAction,
  onSelectDate,
  onOpenAction,
  onUpdateDeadline,
  onTalkToConsultant,
  onTalkToConsultantDay,
  onNewAction,
  onViewAllDeadlines,
}) {
  return (
    <div className="space-y-3">
      <UpcomingDeadlines actions={actions} onSelectDate={onSelectDate} onViewAll={onViewAllDeadlines} />
      <CalendarSummary actions={actions} />
      <DayDetails
        actions={actions}
        selectedDate={selectedDate}
        selectedAction={selectedAction}
        onSelectAction={onSelectAction}
        onOpenAction={onOpenAction}
        onUpdateDeadline={onUpdateDeadline}
        onTalkToConsultant={onTalkToConsultant}
        onTalkToConsultantDay={onTalkToConsultantDay}
        onNewAction={onNewAction}
      />
    </div>
  );
}