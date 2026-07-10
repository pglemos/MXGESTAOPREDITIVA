import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Award, BarChart3, Zap, Search, Play, Video, Star, CheckCircle2, Calendar, Download, MessageSquare, X } from "lucide-react";

const categories = ["Atendimento", "Prospecção", "WhatsApp", "Negociação", "Financiamento", "Fechamento", "Pós-venda", "Carteira", "Mentalidade"];
const levels = ["N1 Iniciante", "N2 Intermediário", "N3 Performance", "N4 Alta Performance"];

const levelColors = {
  "N1 Iniciante": "bg-mx-green-light text-mx-green",
  "N2 Intermediário": "bg-mx-blue-light text-mx-blue",
  "N3 Performance": "bg-mx-amber-light text-mx-amber",
  "N4 Alta Performance": "bg-purple-100 text-purple-700",
};

export default function Treinamentos() {
  const [trainings, setTrainings] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [comment, setComment] = useState("");
  const [savingInteraction, setSavingInteraction] = useState(false);

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
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-200 border-t-mx-blue rounded-full animate-spin" /></div>;
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

  const openTraining = async (training) => {
    setSelectedTraining(training);
    setComment("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("treinamento_avaliacoes").select("comment").eq("training_id", training.id).eq("user_id", user.id).maybeSingle();
    setComment(data?.comment || "");
  };

  const saveComment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedTraining || !comment.trim()) return;
    setSavingInteraction(true);
    const { error } = await supabase.from("treinamento_avaliacoes").upsert({ training_id: selectedTraining.id, user_id: user.id, rating: 5, comment: comment.trim(), updated_at: new Date().toISOString() }, { onConflict: "training_id,user_id" });
    setSavingInteraction(false);
    error ? toast.error(error.message) : toast.success("Comentário e sugestão salvos.");
  };

  const markCompleted = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedTraining) return;
    setSavingInteraction(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("progresso_treinamentos").upsert({ training_id: selectedTraining.id, user_id: user.id, status: "concluido", progress_percent: 100, watched_at: now, completed_at: now, source_context: "universidade_mx" }, { onConflict: "training_id,user_id" });
    if (!error) setProgress(current => [...current.filter(item => item.training_id !== selectedTraining.id), { training_id: selectedTraining.id, completed: true, status: "concluido", progress_percent: 100 }]);
    setSavingInteraction(false);
    error ? toast.error(error.message) : toast.success("Aula concluída e progresso atualizado.");
  };

  const youtubeEmbed = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
  };

  const TrainingCard = ({ training, large = false }) => (
    <button type="button" onClick={() => void openTraining(training)} className={`bg-white rounded-2xl text-left shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md focus:outline-none focus:ring-2 focus:ring-mx-blue transition-all duration-300 ${large ? "col-span-1" : ""}`}>
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
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelColors[training.level] || "bg-slate-100 text-slate-500"}`}>{training.level}</span>
          <span className="text-[10px] text-slate-400">{training.duration_minutes || 30} min</span>
        </div>
        <h4 className="text-sm font-semibold text-mx-navy line-clamp-2">{training.title}</h4>
        <p className="text-xs text-slate-400 mt-1">{training.category}</p>
      </div>
    </button>
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
        <TabsList className="bg-white border border-slate-100 rounded-xl p-1">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Nenhum treinamento encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filtered.map(t => <TrainingCard key={t.id} training={t} />)}
            </div>
          )}
        </TabsContent>

        {/* Trilha */}
        <TabsContent value="trilha" className="mt-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-semibold text-mx-navy mb-2">Sua Maturidade Profissional</h3>
            <p className="text-xs text-slate-400 mb-6">A trilha representa sua maturidade, não apenas evolução.</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {levels.map((level, idx) => {
                const isActive = idx <= Math.min(Math.floor(completedCount / 3), 3);
                return (
                  <div key={level} className={`p-4 rounded-xl border-2 text-center transition-all ${isActive ? "border-mx-blue bg-mx-blue-light/50" : "border-slate-100"}`}>
                    <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold ${isActive ? "bg-mx-blue text-white" : "bg-slate-100 text-slate-400"}`}>
                      {idx + 1}
                    </div>
                    <p className={`text-sm font-semibold ${isActive ? "text-mx-navy" : "text-slate-400"}`}>{level}</p>
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-semibold text-mx-navy mb-1">Presença Validada por Quiz</h3>
            <p className="text-xs text-slate-400">5 a 10 questões · Aprovação mínima: 70%</p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-mx-navy">{avgScore > 0 ? `${avgScore.toFixed(0)}%` : "—"}</p>
                <p className="text-xs text-slate-400">Média das Provas</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-mx-navy">{progress.filter(p => p.attended_live).length}</p>
                <p className="text-xs text-slate-400">Presenças</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-mx-navy">{totalHours.toFixed(1)}h</p>
                <p className="text-xs text-slate-400">Horas Estudadas</p>
              </div>
            </div>
          </div>

          {upcomingLive.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-mx-navy mb-3">Próximas Aulas</h3>
              <div className="space-y-3">
                {upcomingLive.map(t => (
                  <div key={t.id} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-mx-red-light flex items-center justify-center flex-shrink-0">
                      <Video className="w-5 h-5 text-mx-red" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-mx-navy">{t.title}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{t.live_date ? new Date(t.live_date).toLocaleDateString("pt-BR") : "—"}</p>
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
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Nenhuma aula ao vivo agendada.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedTraining && (
        <div className="fixed inset-0 z-[160] grid place-items-center bg-black/55 p-4" onClick={(event) => { if (event.target === event.currentTarget) setSelectedTraining(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="training-detail-title" className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-slate-200 p-5">
              <div><h2 id="training-detail-title" className="text-xl font-bold text-mx-navy">{selectedTraining.title}</h2><p className="mt-1 text-sm text-slate-500">{selectedTraining.description}</p></div>
              <button type="button" onClick={() => setSelectedTraining(null)} aria-label="Fechar aula" className="rounded-lg p-2 hover:bg-slate-100"><X /></button>
            </header>
            <div className="space-y-5 overflow-y-auto p-5">
              <div className="aspect-video overflow-hidden rounded-xl bg-slate-950">
                {youtubeEmbed(selectedTraining.video_url) ? (
                  <iframe className="h-full w-full" src={youtubeEmbed(selectedTraining.video_url)} title={selectedTraining.title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                ) : selectedTraining.video_url ? (
                  <video className="h-full w-full" controls preload="metadata" src={selectedTraining.video_url} />
                ) : <div className="grid h-full place-items-center text-sm text-white/70">Vídeo ainda não publicado.</div>}
              </div>
              <div className="flex flex-wrap gap-3">
                {selectedTraining.material_url && <a href={selectedTraining.material_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-mx-blue"><Download size={16} /> Abrir material complementar</a>}
                <button type="button" disabled={savingInteraction} onClick={() => void markCompleted()} className="inline-flex items-center gap-2 rounded-xl bg-mx-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle2 size={16} /> Marcar como concluída</button>
              </div>
              <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-mx-navy"><MessageSquare size={16} /> Comentário ou sugestão</h3>
                <textarea value={comment} onChange={event => setComment(event.target.value)} maxLength={1000} rows={4} className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-mx-blue" placeholder="Compartilhe uma dúvida, comentário ou sugestão de conteúdo." />
                <div className="mt-3 flex justify-end"><button type="button" disabled={savingInteraction || !comment.trim()} onClick={() => void saveComment()} className="rounded-xl bg-mx-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Salvar comentário</button></div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
