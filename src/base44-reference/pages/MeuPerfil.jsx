import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { UserCircle, Briefcase, Clock, Target, GraduationCap, DollarSign, Save } from "lucide-react";

export default function MeuPerfil() {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    full_name: "", phone: "", birth_date: "", dealership: "", brand: "",
    role: "", experience_years: 0, work_start: "08:00", work_end: "18:00",
    monthly_goal: 10, commission_per_unit: 500, avg_sales_year: 0,
    salary_goal: 0, education: "", job_interest: "Não", avatar_url: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    base44.entities.UserProfile.list().then(profiles => {
      if (profiles[0]) {
        setProfile(profiles[0]);
        setProfileId(profiles[0].id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const data = { ...profile };
    delete data.id;
    delete data.created_date;
    delete data.updated_date;
    delete data.created_by_id;

    if (profileId) {
      await base44.entities.UserProfile.update(profileId, data);
    } else {
      const created = await base44.entities.UserProfile.create(data);
      setProfileId(created.id);
    }
    setSaving(false);
    toast({ title: "Perfil salvo!", description: "Suas informações foram atualizadas." });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#DFE0E1] border-t-mx-blue rounded-full animate-spin" /></div>;
  }

  const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DFE0E1]">
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
      <Label className="text-xs text-[#526B7A] uppercase tracking-wider">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );

  return (
<div className="mx-base44-page space-y-6 lg:space-y-8">
      <PageHeader title="Meu Perfil" subtitle="Gerencie suas informações pessoais e profissionais">
        <Button onClick={handleSave} disabled={saving} className="bg-mx-blue hover:bg-[#00A89D] rounded-xl gap-2">
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
                <Input value={profile.role} onChange={e => setProfile({ ...profile, role: e.target.value })} className="rounded-xl" />
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
              <Input type="time" value={profile.work_start} onChange={e => setProfile({ ...profile, work_start: e.target.value })} className="rounded-xl" />
            </Field>
            <Field label="Fim do Expediente">
              <Input type="time" value={profile.work_end} onChange={e => setProfile({ ...profile, work_end: e.target.value })} className="rounded-xl" />
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
            <div className="grid grid-cols-2 gap-4">
              <Field label="Comissão por Unidade (R$)">
                <Input type="number" value={profile.commission_per_unit} onChange={e => setProfile({ ...profile, commission_per_unit: parseInt(e.target.value) || 0 })} className="rounded-xl" />
              </Field>
              <Field label="Meta de Remuneração (R$)">
                <Input type="number" value={profile.salary_goal} onChange={e => setProfile({ ...profile, salary_goal: parseInt(e.target.value) || 0 })} className="rounded-xl" />
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
