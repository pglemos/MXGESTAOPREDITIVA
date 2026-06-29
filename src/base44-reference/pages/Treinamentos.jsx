import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Award, BarChart3, Zap, Search, Play, Video, Star, CheckCircle2, Calendar } from "lucide-react";

const categories = ["Atendimento", "Prospecção", "WhatsApp", "Negociação", "Financiamento", "Fechamento", "Pós-venda", "Carteira", "Mentalidade"];
const levels = ["N1 Iniciante", "N2 Intermediário", "N3 Performance", "N4 Alta Performance"];

const levelColors = {
  "N1 Iniciante": "bg-mx-green-light text-mx-green",
  "N2 Intermediário": "bg-mx-blue-light text-mx-blue",
  "N3 Performance": "bg-mx-amber-light text-mx-amber",
  "N4 Alta Performance": "bg-[#F15BBA] text-[#F15BBA]",
};

export default function Treinamentos() {
  const [trainings, setTrainings] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  useEffect(() => {
    Promise.all([
      base44.entities.Training.list('-created_date', 50).catch(() => []),
      base44.entities.TrainingProgress.list().catch(() => []),
    ]).then(([t, p]) => {
      setTrainings(t);
      setProgress(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#DFE0E1] border-t-mx-blue rounded-full animate-spin" /></div>;
  }

  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.training_id));
  const totalHours = progress.reduce((sum, p) => sum + (p.hours_studied || 0), 0);
  const avgScore = progress.filter(p => p.quiz_score).reduce((sum, p, _, arr) => sum + p.quiz_score / arr.length, 0);
  const completedCount = completedIds.size;

  const filtered = trainings.filter(t => {
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== "all" && t.category !== filterCat) return false;
    if (filterLevel !== "all" && t.level !== filterLevel) return false;
    return true;
  });

  const liveTrainings = trainings.filter(t => t.is_live);
  const upcomingLive = liveTrainings.filter(t => t.live_date && new Date(t.live_date) > new Date());
  const pastLive = liveTrainings.filter(t => t.live_date && new Date(t.live_date) <= new Date());

  const TrainingCard = ({ training, large = false }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-[#DFE0E1] overflow-hidden group hover:shadow-md transition-all duration-300 ${large ? "col-span-1" : ""}`}>
      <div className={`${large ? "h-40" : "h-28"} bg-gradient-to-br from-mx-navy to-mx-blue relative overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="w-10 h-10 text-white/30 group-hover:text-white/60 transition-colors" />
        </div>
        {completedIds.has(training.id) && (
          <div className="absolute top-3 right-3">
            <CheckCircle2 className="w-6 h-6 text-mx-green" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelColors[training.level] || "bg-[#DFE0E1] text-[#526B7A]"}`}>{training.level}</span>
          <span className="text-[10px] text-[#526B7A]">{training.duration_minutes || 30} min</span>
        </div>
        <h4 className="text-sm font-semibold text-mx-navy line-clamp-2">{training.title}</h4>
        <p className="text-xs text-[#526B7A] mt-1">{training.category}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Treinamentos" subtitle="Desenvolva suas habilidades de vendas" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Minha Trilha" value={completedCount > 0 ? levels[Math.min(Math.floor(completedCount / 3), 3)] : "N1"} icon={Star} color="blue" />
        <StatCard label="Progresso" value={`${trainings.length > 0 ? Math.round((completedCount / trainings.length) * 100) : 0}%`} icon={BarChart3} color="green" />
        <StatCard label="Horas Estudadas" value={totalHours.toFixed(1)} icon={Clock} color="amber" />
        <StatCard label="Média nas Provas" value={avgScore > 0 ? `${avgScore.toFixed(0)}%` : "—"} icon={Award} color="navy" />
        <StatCard label="Impacto no Score" value="+12" icon={Zap} color="green" />
      </div>

      <Tabs defaultValue="biblioteca" className="w-full">
        <TabsList className="bg-white border border-[#DFE0E1] rounded-xl p-1">
          <TabsTrigger value="biblioteca" className="rounded-lg data-[state=active]:bg-mx-blue data-[state=active]:text-white">Biblioteca</TabsTrigger>
          <TabsTrigger value="trilha" className="rounded-lg data-[state=active]:bg-mx-blue data-[state=active]:text-white">Trilha</TabsTrigger>
          <TabsTrigger value="aovivo" className="rounded-lg data-[state=active]:bg-mx-blue data-[state=active]:text-white">Aulas ao Vivo</TabsTrigger>
        </TabsList>

        {/* Biblioteca */}
        <TabsContent value="biblioteca" className="mt-6 space-y-6">
          {/* Recommended */}
          {trainings.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-mx-navy mb-4">Recomendado para Você</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trainings.slice(0, 4).map(t => <TrainingCard key={t.id} training={t} large />)}
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#526B7A]" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar treinamento..." className="pl-9 rounded-xl bg-white" />
            </div>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-[160px] rounded-xl bg-white"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[180px] rounded-xl bg-white"><SelectValue placeholder="Nível" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#DFE0E1]">
              <BookOpen className="w-10 h-10 text-[#E0EBEA] mx-auto mb-3" />
              <p className="text-sm text-[#526B7A]">Nenhum treinamento encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filtered.map(t => <TrainingCard key={t.id} training={t} />)}
            </div>
          )}
        </TabsContent>

        {/* Trilha */}
        <TabsContent value="trilha" className="mt-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DFE0E1]">
            <h3 className="text-base font-semibold text-mx-navy mb-2">Sua Maturidade Profissional</h3>
            <p className="text-xs text-[#526B7A] mb-6">A trilha representa sua maturidade, não apenas evolução.</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {levels.map((level, idx) => {
                const isActive = idx <= Math.min(Math.floor(completedCount / 3), 3);
                return (
                  <div key={level} className={`p-4 rounded-xl border-2 text-center transition-all ${isActive ? "border-mx-blue bg-mx-blue-light/50" : "border-[#DFE0E1]"}`}>
                    <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold ${isActive ? "bg-mx-blue text-white" : "bg-[#DFE0E1] text-[#526B7A]"}`}>
                      {idx + 1}
                    </div>
                    <p className={`text-sm font-semibold ${isActive ? "text-mx-navy" : "text-[#526B7A]"}`}>{level}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {levels.map(level => {
            const levelTrainings = trainings.filter(t => t.level === level);
            if (levelTrainings.length === 0) return null;
            return (
              <div key={level}>
                <h3 className="text-sm font-semibold text-mx-navy mb-3">{level}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {levelTrainings.map(t => <TrainingCard key={t.id} training={t} />)}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* Aulas ao Vivo */}
        <TabsContent value="aovivo" className="mt-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DFE0E1]">
            <h3 className="text-base font-semibold text-mx-navy mb-1">Presença Validada por Quiz</h3>
            <p className="text-xs text-[#526B7A]">5 a 10 questões · Aprovação mínima: 70%</p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-[#F7F8F8] rounded-xl">
                <p className="text-2xl font-bold text-mx-navy">{avgScore > 0 ? `${avgScore.toFixed(0)}%` : "—"}</p>
                <p className="text-xs text-[#526B7A]">Média das Provas</p>
              </div>
              <div className="text-center p-3 bg-[#F7F8F8] rounded-xl">
                <p className="text-2xl font-bold text-mx-navy">{progress.filter(p => p.attended_live).length}</p>
                <p className="text-xs text-[#526B7A]">Presenças</p>
              </div>
              <div className="text-center p-3 bg-[#F7F8F8] rounded-xl">
                <p className="text-2xl font-bold text-mx-navy">{totalHours.toFixed(1)}h</p>
                <p className="text-xs text-[#526B7A]">Horas Estudadas</p>
              </div>
            </div>
          </div>

          {upcomingLive.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-mx-navy mb-3">Próximas Aulas</h3>
              <div className="space-y-3">
                {upcomingLive.map(t => (
                  <div key={t.id} className="bg-white rounded-xl p-4 border border-[#DFE0E1] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-mx-red-light flex items-center justify-center flex-shrink-0">
                      <Video className="w-5 h-5 text-mx-red" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-mx-navy">{t.title}</p>
                      <p className="text-xs text-[#526B7A] flex items-center gap-1"><Calendar className="w-3 h-3" />{t.live_date ? new Date(t.live_date).toLocaleDateString("pt-BR") : "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastLive.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-mx-navy mb-3">Gravações</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastLive.map(t => <TrainingCard key={t.id} training={t} />)}
              </div>
            </div>
          )}

          {liveTrainings.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#DFE0E1]">
              <Video className="w-10 h-10 text-[#E0EBEA] mx-auto mb-3" />
              <p className="text-sm text-[#526B7A]">Nenhuma aula ao vivo agendada.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}