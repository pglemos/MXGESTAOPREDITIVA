import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { UserCircle, Briefcase, Clock, Target, GraduationCap, DollarSign, Save } from "lucide-react";

const formatBRL = (value) =>
  `R$ ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MeuPerfil() {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    birth_date: "",
    dealership: "",
    brand: "",
    role: "",
    remuneracao_plano_id: "",
    available_plans: [],
    experience_years: 0,
    work_schedule_id: "08:00-18:00",
    work_schedule_options: [],
    work_start: "08:00",
    work_end: "18:00",
    monthly_goal: 10,
    commission_per_unit: 500,
    avg_sales_year: 0,
    salary_goal: 0,
    education: "",
    job_interest: "Não",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profiles = await base44.entities.UserProfile.list().catch(() => []);
        const legacyProfile = profiles[0] || {};
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const [{ data: usuario }, { data: vendedorPerfil }, { data: vinculos }] = await Promise.all([
          supabase.from("usuarios").select("name,phone,avatar_url").eq("id", user.id).maybeSingle(),
          supabase.from("vendedor_perfil").select("*").eq("seller_user_id", user.id).maybeSingle(),
          supabase.from("vinculos_loja").select("store_id").eq("user_id", user.id).eq("is_active", true).limit(1),
        ]);

        const storeId = vendedorPerfil?.loja_id || vinculos?.[0]?.store_id || legacyProfile.dealership || "";
        const workStart = vendedorPerfil?.hora_entrada ? vendedorPerfil.hora_entrada.slice(0, 5) : legacyProfile.work_start || legacyProfile.start_hour || "08:00";
        const workEnd = vendedorPerfil?.hora_saida ? vendedorPerfil.hora_saida.slice(0, 5) : legacyProfile.work_end || legacyProfile.end_hour || "18:00";
        const { data: planos } = storeId
          ? await supabase
            .from("remuneracao_planos")
            .select("id,cargo,salario_fixo,salario_variavel,beneficios,vigencia_inicio")
            .eq("loja_id", storeId)
            .order("cargo")
            .order("vigencia_inicio", { ascending: false })
          : { data: [] };
        const { data: jornadas } = storeId
          ? await supabase
            .from("vendedor_perfil")
            .select("hora_entrada,hora_saida")
            .eq("loja_id", storeId)
            .not("hora_entrada", "is", null)
            .not("hora_saida", "is", null)
          : { data: [] };

        const availablePlans = (planos || []).map(plano => ({
          id: plano.id,
          cargo: plano.cargo,
          label: `${plano.cargo} - R$ ${Number(plano.salario_fixo || 0).toLocaleString("pt-BR")} fixo`,
          salary_goal: Number(plano.salario_fixo || 0) + Number(plano.salario_variavel || 0) + Number(plano.beneficios || 0),
          commission_per_unit: Number(plano.salario_variavel || 0),
        }));
        const selectedPlan = availablePlans.find(plan => plan.id === vendedorPerfil?.remuneracao_plano_id)
          || availablePlans.find(plan => plan.cargo?.toLowerCase() === vendedorPerfil?.cargo_atual?.toLowerCase())
          || (availablePlans.length === 1 ? availablePlans[0] : null);
        const scheduleByKey = new Map();
        [...(jornadas || []), { hora_entrada: workStart, hora_saida: workEnd }].forEach(jornada => {
          const start = jornada?.hora_entrada ? jornada.hora_entrada.slice(0, 5) : "";
          const end = jornada?.hora_saida ? jornada.hora_saida.slice(0, 5) : "";
          if (!start || !end) return;
          scheduleByKey.set(`${start}-${end}`, { id: `${start}-${end}`, label: `${start} - ${end}`, work_start: start, work_end: end });
        });

        setProfile(prev => ({
          ...prev,
          ...legacyProfile,
          id: vendedorPerfil?.id || legacyProfile.id || user.id,
          full_name: usuario?.name || legacyProfile.full_name || legacyProfile.name || "",
          phone: usuario?.phone || legacyProfile.phone || "",
          dealership: storeId,
          role: selectedPlan?.cargo || vendedorPerfil?.cargo_atual || legacyProfile.role || "Vendedor",
          remuneracao_plano_id: vendedorPerfil?.remuneracao_plano_id || selectedPlan?.id || "",
          available_plans: availablePlans,
          experience_years: vendedorPerfil?.tempo_mercado_anos || legacyProfile.experience_years || 0,
          work_schedule_id: `${workStart}-${workEnd}`,
          work_schedule_options: Array.from(scheduleByKey.values()),
          work_start: workStart,
          work_end: workEnd,
          commission_per_unit: selectedPlan?.commission_per_unit ?? legacyProfile.commission_per_unit ?? 500,
          salary_goal: selectedPlan?.salary_goal ?? vendedorPerfil?.pretensao_min ?? legacyProfile.salary_goal ?? legacyProfile.target_salary ?? 0,
          job_interest: vendedorPerfil?.carreira_interesse === "disponivel" ? "Disponível para o mercado" : vendedorPerfil?.carreira_interesse === "confidencial" ? "Confidencial" : "Não",
          avatar_url: usuario?.avatar_url || legacyProfile.avatar_url || "",
        }));
        setProfileId(vendedorPerfil?.id || legacyProfile.id || user.id);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const data = { ...profile };
    delete data.id;
    delete data.created_date;
    delete data.updated_date;
    delete data.created_by_id;
    delete data.available_plans;
    delete data.work_schedule_options;
    delete data.work_schedule_id;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");
      const { data: vinculos } = await supabase
        .from("vinculos_loja")
        .select("store_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1);
      const storeId = data.dealership || vinculos?.[0]?.store_id || null;

      await supabase
        .from("usuarios")
        .update({ name: data.full_name, phone: data.phone, avatar_url: data.avatar_url })
        .eq("id", user.id);

      // Remuneração (cargo_atual, remuneracao_plano_id, pretensao_min) é controlada
      // exclusivamente pelo dono via CadastroCarreira/EquipeUsuariosTab — o vendedor
      // não altera esses campos por aqui. Este upsert grava apenas dados pessoais/jornada/carreira.
      const { data: savedProfile, error } = await supabase
        .from("vendedor_perfil")
        .upsert({
          seller_user_id: user.id,
          loja_id: storeId,
          hora_entrada: data.work_start ? `${data.work_start}:00` : null,
          hora_saida: data.work_end ? `${data.work_end}:00` : null,
          tempo_mercado_anos: data.experience_years,
          carreira_interesse: data.job_interest === "Disponível para o mercado" ? "disponivel" : data.job_interest === "Confidencial" ? "confidencial" : "nao",
        }, { onConflict: "seller_user_id" })
        .select()
        .single();
      if (error) throw error;
      setProfileId(savedProfile.id);
      toast({ title: "Perfil salvo!", description: "Suas informações foram atualizadas." });
    } catch (e) {
      toast({ title: "Erro ao salvar perfil", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-200 border-t-mx-blue rounded-full animate-spin" /></div>;
  }

  const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-mx-blue-light flex items-center justify-center">
          <Icon className="w-4 h-4 text-mx-blue" />
        </div>
        <h3 className="text-base font-semibold text-mx-navy">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, children }) => (
    <div>
      <Label className="text-xs text-slate-500 uppercase tracking-wider">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Meu Perfil" subtitle="Gerencie suas informações pessoais e profissionais">
        <Button onClick={handleSave} disabled={saving} className="bg-mx-blue hover:bg-blue-600 rounded-xl gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal */}
        <Section title="Informações Pessoais" icon={UserCircle}>
          <div className="grid gap-4">
            <Field label="Nome Completo">
              <Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className="rounded-xl" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Telefone">
                <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="(00) 00000-0000" className="rounded-xl" />
              </Field>
              <Field label="Data de Nascimento">
                <Input type="date" value={profile.birth_date} onChange={e => setProfile({ ...profile, birth_date: e.target.value })} className="rounded-xl" />
              </Field>
            </div>
          </div>
        </Section>

        {/* Professional */}
        <Section title="Informações Profissionais" icon={Briefcase}>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Concessionária">
                <Input value={profile.dealership} onChange={e => setProfile({ ...profile, dealership: e.target.value })} className="rounded-xl" />
              </Field>
              <Field label="Marca">
                <Input value={profile.brand} onChange={e => setProfile({ ...profile, brand: e.target.value })} className="rounded-xl" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cargo">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-mx-navy min-h-[38px] flex items-center">
                  {profile.role || "Vendedor"}
                </div>
              </Field>
              <Field label="Anos de Experiência">
                <Input type="number" value={profile.experience_years} onChange={e => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })} className="rounded-xl" />
              </Field>
            </div>
          </div>
        </Section>

        {/* Work Schedule */}
        <Section title="Horário de Trabalho" icon={Clock}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Início do Expediente">
              <Input list="work-start-options" type="time" value={profile.work_start} onChange={e => setProfile({ ...profile, work_start: e.target.value })} className="rounded-xl" />
              <datalist id="work-start-options">
                {profile.work_schedule_options?.map(option => (
                  <option key={option.id} value={option.work_start}>{option.label}</option>
                ))}
              </datalist>
            </Field>
            <Field label="Fim do Expediente">
              <Input list="work-end-options" type="time" value={profile.work_end} onChange={e => setProfile({ ...profile, work_end: e.target.value })} className="rounded-xl" />
              <datalist id="work-end-options">
                {profile.work_schedule_options?.map(option => (
                  <option key={option.id} value={option.work_end}>{option.label}</option>
                ))}
              </datalist>
            </Field>
          </div>
        </Section>

        {/* Goals */}
        <Section title="Objetivos e Metas" icon={Target}>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Meta Mensal (unidades)">
                <Input type="number" value={profile.monthly_goal} onChange={e => setProfile({ ...profile, monthly_goal: parseInt(e.target.value) || 0 })} className="rounded-xl" />
              </Field>
              <Field label="Média de Vendas Ano">
                <Input type="number" value={profile.avg_sales_year} onChange={e => setProfile({ ...profile, avg_sales_year: parseInt(e.target.value) || 0 })} className="rounded-xl" />
              </Field>
            </div>
          </div>
        </Section>

        {/* Education */}
        <Section title="Formação" icon={GraduationCap}>
          <Field label="Formação Acadêmica">
            <Input value={profile.education} onChange={e => setProfile({ ...profile, education: e.target.value })} placeholder="Ex: Administração de Empresas" className="rounded-xl" />
          </Field>
        </Section>

        {/* Compensation */}
        <Section title="Remuneração" icon={DollarSign}>
          <div className="grid gap-4">
            {/* Somente leitura — a remuneração é definida pelo plano/cargo atribuído
                pelo dono; o vendedor não edita comissão ou meta de remuneração aqui. */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Comissão por Unidade">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-mx-navy min-h-[38px] flex items-center">
                  {formatBRL(profile.commission_per_unit)}
                </div>
              </Field>
              <Field label="Meta de Remuneração">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-mx-navy min-h-[38px] flex items-center">
                  {formatBRL(profile.salary_goal)}
                </div>
              </Field>
            </div>
            <Field label="Interesse em Oportunidades">
              <Select value={profile.job_interest} onValueChange={v => setProfile({ ...profile, job_interest: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Não">Não</SelectItem>
                  <SelectItem value="Confidencial">Confidencial</SelectItem>
                  <SelectItem value="Disponível para o mercado">Disponível para o mercado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>
      </div>
    </div>
  );
}
