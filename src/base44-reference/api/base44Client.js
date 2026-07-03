import { supabase } from '@/lib/supabase';
import moment from 'moment';

// Helper to filter items in Javascript (MongoDB-like selector)
function matchQuery(row, filter) {
  if (!filter) return true;
  for (const key in filter) {
    const val = filter[key];
    const rowVal = row[key];
    if (typeof val === 'object' && val !== null) {
      if ('$gte' in val && !(rowVal >= val.$gte)) return false;
      if ('$lte' in val && !(rowVal <= val.$lte)) return false;
      if ('$gt' in val && !(rowVal > val.$gt)) return false;
      if ('$lt' in val && !(rowVal < val.$lt)) return false;
    } else {
      if (rowVal !== val) return false;
    }
  }
  return true;
}

// Helper to sort items
function sortRows(rows, order) {
  if (!order) return rows;
  const desc = order.startsWith('-');
  const key = desc ? order.slice(1) : order;
  return [...rows].sort((a, b) => {
    let valA = a[key];
    let valB = b[key];
    if (valA === undefined || valA === null) return desc ? 1 : -1;
    if (valB === undefined || valB === null) return desc ? -1 : 1;
    if (typeof valA === 'string') {
      return desc ? valB.localeCompare(valA) : valA.localeCompare(valB);
    }
    return desc ? valB - valA : valA - valB;
  });
}

// LocalStorage helpers for virtual tables
const getLocal = (key, userId = '') => {
  const raw = localStorage.getItem(`mx_b44_${key}`);
  if (raw) return JSON.parse(raw);
  
  if (key === 'AtividadeExecucao') {
    const todayStr = moment().format('YYYY-MM-DD');
    const defaults = [
      {
        id: 'act_1',
        vendedor_id: userId,
        tipo_atividade: 'agendamento',
        titulo: 'Confirmar test-drive com cliente João',
        descricao: 'Ligar para confirmar se virá no horário agendado de hoje.',
        objetivo: 'Atendimento',
        data_hora_execucao: `${todayStr}T10:00:00Z`,
        data_execucao: todayStr,
        prioridade: 9,
        status_atividade: 'Pendente',
        ativo: true
      },
      {
        id: 'act_2',
        vendedor_id: userId,
        tipo_atividade: 'retorno',
        titulo: 'Enviar proposta final do Hatch 2024',
        descricao: 'Seguir com negociação enviando a proposta revisada por WhatsApp.',
        objetivo: 'Retorno',
        data_hora_execucao: `${todayStr}T14:30:00Z`,
        data_execucao: todayStr,
        prioridade: 7,
        status_atividade: 'Pendente',
        ativo: true
      },
      {
        id: 'act_3',
        vendedor_id: userId,
        tipo_atividade: 'garantia',
        titulo: 'Verificar status da documentação do cliente Maria',
        descricao: 'Acompanhar aprovação do despachante junto ao gerente.',
        objetivo: 'Garantia',
        data_hora_execucao: `${todayStr}T16:00:00Z`,
        data_execucao: todayStr,
        prioridade: 4,
        status_atividade: 'Pendente',
        ativo: true
      }
    ];
    localStorage.setItem(`mx_b44_${key}`, JSON.stringify(defaults));
    return defaults;
  }

  if (key === 'ExecutionOpportunity') {
    const todayStr = moment().format('YYYY-MM-DD');
    const defaults = [
      {
        id: 'op_1',
        vendedor_id: userId,
        tipo: 'Venda Perdida',
        titulo: 'Ação Corretiva Hatch 2024',
        descricao: 'Recuperar cliente que comprou no concorrente.',
        objetivo: 'Ação Corretiva',
        data_hora_execucao: `${todayStr}T11:00:00Z`,
        prioridade: 5,
        status: 'Pendente',
        ativo: true
      }
    ];
    localStorage.setItem(`mx_b44_${key}`, JSON.stringify(defaults));
    return defaults;
  }

  if (key === 'ActionPlan') {
    const defaults = [
      { id: 'ap_1', pdi_id: 'pdi_1', title: 'Melhorar taxa de prospecção digital', status: 'Em Andamento', progress: 60, created_date: new Date().toISOString() },
      { id: 'ap_2', pdi_id: 'pdi_1', title: 'Assistir curso de negociação avançada', status: 'Pendente', progress: 0, created_date: new Date().toISOString() }
    ];
    localStorage.setItem(`mx_b44_${key}`, JSON.stringify(defaults));
    return defaults;
  }

  if (key === 'EventoComercial') {
    const today = moment().format('YYYY-MM-DD');
    const defaults = [
      { id: 'evt_1', vendedor_id: userId, data_evento: today, tipo_evento: 'atendimento_comercial_realizado', canal_mx: 'Showroom', modalidade: 'Visita na loja', status_evento: 'Realizado', created_date: new Date().toISOString() },
      { id: 'evt_2', vendedor_id: userId, data_evento: today, tipo_evento: 'atendimento_comercial_realizado', canal_mx: 'Internet', modalidade: 'Videochamada', status_evento: 'Realizado', created_date: new Date().toISOString() },
      { id: 'evt_3', vendedor_id: userId, data_evento: today, tipo_evento: 'venda_realizada', canal_mx: 'Showroom', status_evento: 'Realizado', created_date: new Date().toISOString() },
      { id: 'evt_4', vendedor_id: userId, data_evento: today, tipo_evento: 'proposta_enviada', canal_mx: 'Carteira', status_evento: 'Realizado', created_date: new Date().toISOString() }
    ];
    localStorage.setItem(`mx_b44_${key}`, JSON.stringify(defaults));
    return defaults;
  }
  
  return [];
};
const setLocal = (key, val) => localStorage.setItem(`mx_b44_${key}`, JSON.stringify(val));

export const base44 = {
  auth: {
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');
      
      const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email,
        full_name: profile?.name || 'Vendedor',
        phone: profile?.phone || '',
        avatar_url: profile?.avatar_url || '',
        role: profile?.role || 'vendedor',
      };
    },
    logout: async () => {
      await supabase.auth.signOut();
      window.location.href = '/login';
    },
    redirectToLogin: () => {
      window.location.href = '/login';
    }
  },

  analytics: {
    track: ({ eventName, properties }) => {
      console.log('[Analytics Track]', eventName, properties);
    }
  },

  entities: {
    UserProfile: {
      list: async () => {
        const me = await base44.auth.me();
        const { data: perf } = await supabase
          .from('vendedor_perfil')
          .select('*')
          .eq('seller_user_id', me.id)
          .maybeSingle();

        return [{
          id: perf?.id || me.id,
          full_name: me.full_name,
          phone: me.phone,
          birth_date: '',
          dealership: perf?.loja_id || '',
          brand: '',
          role: perf?.cargo_atual || 'Vendedor',
          experience_years: perf?.tempo_mercado_anos || 0,
          work_start: perf?.hora_entrada ? perf.hora_entrada.slice(0, 5) : '08:00',
          work_end: perf?.hora_saida ? perf.hora_saida.slice(0, 5) : '18:00',
          monthly_goal: 10,
          commission_per_unit: 500,
          avg_sales_year: 0,
          salary_goal: perf?.pretensao_min || 0,
          education: '',
          job_interest: perf?.carreira_interesse === 'disponivel' ? 'Disponível para o mercado' : perf?.carreira_interesse === 'confidencial' ? 'Confidencial' : 'Não',
          avatar_url: me.avatar_url
        }];
      },
      update: async (id, data) => {
        const me = await base44.auth.me();
        
        // Update usuarios
        if (data.full_name || data.phone || data.avatar_url) {
          await supabase.from('usuarios').update({
            name: data.full_name,
            phone: data.phone,
            avatar_url: data.avatar_url
          }).eq('id', me.id);
        }

        // Update vendedor_perfil
        const profilePayload = {
          seller_user_id: me.id,
          hora_entrada: data.work_start ? `${data.work_start}:00` : null,
          hora_saida: data.work_end ? `${data.work_end}:00` : null,
          tempo_mercado_anos: data.experience_years,
          cargo_atual: data.role,
          carreira_interesse: data.job_interest === 'Disponível para o mercado' ? 'disponivel' : data.job_interest === 'Confidencial' ? 'confidencial' : 'nao',
          pretensao_min: data.salary_goal,
        };

        const { data: upserted } = await supabase
          .from('vendedor_perfil')
          .upsert(profilePayload, { onConflict: 'seller_user_id' })
          .select()
          .single();

        return upserted;
      },
      create: async (data) => {
        return base44.entities.UserProfile.update(null, data);
      }
    },

    DailyClose: {
      filter: async (filter, order, limit) => {
        const me = await base44.auth.me();
        const { data: rows } = await supabase
          .from('lancamentos_diarios')
          .select('*')
          .eq('seller_user_id', me.id);

        const mapped = (rows || []).map(r => ({
          id: r.id,
          date: r.reference_date || r.date,
          vendedor_id: r.seller_user_id,
          loja_id: r.store_id,
          leads_carteira: r.leads || r.leads_prev_day || 0,
          leads_internet: 0,
          atendimentos_showroom: r.visit_prev_day || r.visitas || 0,
          atendimentos_carteira: r.vnd_cart_prev_day || r.vnd_cart || 0,
          atendimentos_internet: r.vnd_net_prev_day || r.vnd_net || 0,
          agendamentos_carteira: r.agd_cart_today || r.agd_cart_prev_day || 0,
          agendamentos_internet: r.agd_net_today || r.agd_net_prev_day || 0,
          status_fechamento: r.submission_status === 'on_time' || r.submission_status === 'late' ? 'Fechado' : 'Aberto',
          finalizado: r.submission_status === 'on_time' || r.submission_status === 'late' || r.fechamento_liberado,
          data_hora_finalizacao: r.submitted_at,
          observacao_geral: r.note,
          status_regularizacao: r.submission_status === 'late' ? 'Aprovado' : null
        }));

        const filtered = mapped.filter(r => matchQuery(r, filter));
        const sorted = sortRows(filtered, order);
        return limit ? sorted.slice(0, limit) : sorted;
      },
      create: async (data) => {
        const me = await base44.auth.me();
        
        // Fetch active store for vendor
        const { data: vinculos } = await supabase
          .from('vinculos_loja')
          .select('store_id')
          .eq('user_id', me.id)
          .eq('is_active', true)
          .limit(1);
        const storeId = vinculos?.[0]?.store_id;

        const payload = {
          metric_scope: 'daily',
          store_id: storeId,
          seller_user_id: me.id,
          reference_date: data.date,
          date: data.date,
          leads: data.leads_carteira || 0,
          leads_prev_day: data.leads_carteira || 0,
          visit_prev_day: data.atendimentos_showroom || 0,
          visitas: data.atendimentos_showroom || 0,
          vnd_cart_prev_day: data.atendimentos_carteira || 0,
          vnd_cart: data.atendimentos_carteira || 0,
          vnd_net_prev_day: data.atendimentos_internet || 0,
          vnd_net: data.atendimentos_internet || 0,
          agd_cart_today: data.agendamentos_carteira || 0,
          agd_cart_prev_day: data.agendamentos_carteira || 0,
          agd_net_today: data.agendamentos_internet || 0,
          agd_net_prev_day: data.agendamentos_internet || 0,
          submission_status: data.finalizado ? 'on_time' : 'draft',
          submitted_at: new Date().toISOString(),
          note: data.observacao_geral || ''
        };

        const { data: created, error } = await supabase
          .rpc('submit_checkin', { p_payload: payload });

        if (error) throw error;
        return created;
      },
      update: async (id, data) => {
        // Map updates to submit_checkin
        return base44.entities.DailyClose.create({ ...data, id });
      }
    },

    CarteiraCliente: {
      filter: async (filter, order, limit) => {
        const me = await base44.auth.me();
        const { data: clients } = await supabase
          .from('clientes')
          .select('*, oportunidades(*), agendamentos(*)')
          .eq('seller_user_id', me.id);

        const mapped = (clients || []).map(r => {
          const op = r.oportunidades?.[0] || {};
          const agd = r.agendamentos?.[0] || {};
          return {
            id: r.id,
            vendedor_id: r.seller_user_id,
            loja_id: r.loja_id,
            nome: r.nome,
            telefone: r.telefone,
            whatsapp: r.telefone,
            data_nascimento: null,
            canal_comercial: r.canal_origem || 'Carteira',
            canal_entrada: r.canal_origem || 'Carteira',
            canal_venda: op.canal || r.canal_origem || 'Carteira',
            status_comercial: op.etapa === 'ganho' ? 'Vendido' : op.etapa === 'perdido' ? 'Perdido' : 'Em Negociação',
            situacao_atual: op.etapa || 'prospeccao',
            veiculo_interesse: op.veiculo_interesse || '',
            valor_negociado: op.valor_negociado || 0,
            sinal: op.sinal || 0,
            financiamento: op.financiamento || 'Não se aplica',
            carro_avaliado: op.carro_avaliado ? 'Sim' : 'Não',
            data_venda: op.closed_at,
            valor_venda: op.valor_negociado || 0,
            veiculo_comprado: op.veiculo_interesse || '',
            ativo: r.status !== 'inativo',
            visita_agendada_em: agd.data_hora || r.proxima_acao_em,
            origem_detalhada: r.observacoes || '',
            created_date: r.created_at,
            updated_date: r.updated_at
          };
        });

        const filtered = mapped.filter(r => matchQuery(r, filter));
        const sorted = sortRows(filtered, order);
        return limit ? sorted.slice(0, limit) : sorted;
      },
      create: async (data) => {
        const me = await base44.auth.me();
        
        // Fetch active store for vendor
        const { data: vinculos } = await supabase
          .from('vinculos_loja')
          .select('store_id')
          .eq('user_id', me.id)
          .eq('is_active', true)
          .limit(1);
        const storeId = vinculos?.[0]?.store_id;

        const { data: client, error: clErr } = await supabase
          .from('clientes')
          .insert({
            nome: data.nome,
            telefone: data.telefone || data.whatsapp || '',
            canal_origem: data.canal_comercial || 'Carteira',
            status: data.ativo === false ? 'inativo' : 'oportunidade',
            loja_id: storeId,
            seller_user_id: me.id,
            observacoes: data.origem_detalhada || ''
          })
          .select()
          .single();

        if (clErr) throw clErr;

        const { data: op, error: opErr } = await supabase
          .from('oportunidades')
          .insert({
            cliente_id: client.id,
            veiculo_interesse: data.veiculo_interesse || '',
            valor_negociado: data.valor_negociado || 0,
            etapa: data.status_comercial === 'Vendido' ? 'ganho' : data.status_comercial === 'Perdido' ? 'perdido' : 'prospeccao',
            loja_id: storeId,
            seller_user_id: me.id,
            sinal: data.sinal || 0,
            financiamento: data.financiamento || 'nao_aplica',
            carro_avaliado: data.carro_avaliado === 'Sim'
          })
          .select()
          .single();

        if (opErr) throw opErr;

        if (data.visita_agendada_em) {
          await supabase.from('agendamentos').insert({
            cliente_id: client.id,
            oportunidade_id: op.id,
            data_hora: data.visita_agendada_em,
            loja_id: storeId,
            seller_user_id: me.id,
            tipo: 'visita',
            status: 'confirmado'
          });
        }

        return { ...data, id: client.id };
      },
      update: async (id, data) => {
        const me = await base44.auth.me();
        
        // Update client
        const clPayload = {};
        if (data.nome !== undefined) clPayload.nome = data.nome;
        if (data.telefone !== undefined) clPayload.telefone = data.telefone;
        if (data.ativo !== undefined) clPayload.status = data.ativo === false ? 'inativo' : 'oportunidade';
        if (data.origem_detalhada !== undefined) clPayload.observacoes = data.origem_detalhada;
        
        if (Object.keys(clPayload).length > 0) {
          await supabase.from('clientes').update(clPayload).eq('id', id);
        }

        // Update opportunity
        const opPayload = {};
        if (data.veiculo_interesse !== undefined) opPayload.veiculo_interesse = data.veiculo_interesse;
        if (data.valor_negociado !== undefined) opPayload.valor_negociado = data.valor_negociado;
        if (data.status_comercial !== undefined) {
          opPayload.etapa = data.status_comercial === 'Vendido' ? 'ganho' : data.status_comercial === 'Perdido' ? 'perdido' : 'prospeccao';
          if (data.status_comercial === 'Vendido') opPayload.closed_at = new Date().toISOString();
        }
        if (data.situacao_atual !== undefined) opPayload.etapa = data.situacao_atual;
        if (data.sinal !== undefined) opPayload.sinal = data.sinal;
        if (data.financiamento !== undefined) opPayload.financiamento = data.financiamento;
        if (data.carro_avaliado !== undefined) opPayload.carro_avaliado = data.carro_avaliado === 'Sim';

        if (Object.keys(opPayload).length > 0) {
          await supabase.from('oportunidades').update(opPayload).eq('cliente_id', id);
        }

        // Handle appointment
        if (data.visita_agendada_em) {
          const { data: op } = await supabase.from('oportunidades').select('id, loja_id').eq('cliente_id', id).maybeSingle();
          if (op) {
            await supabase.from('agendamentos').upsert({
              cliente_id: id,
              oportunidade_id: op.id,
              data_hora: data.visita_agendada_em,
              loja_id: op.loja_id,
              seller_user_id: me.id,
              tipo: 'visita',
              status: 'confirmado'
            }, { onConflict: 'cliente_id' });
          }
        }

        return { ...data, id };
      },
      get: async (id) => {
        const list = await base44.entities.CarteiraCliente.filter({ id });
        return list[0] || null;
      }
    },

    Client: {
      filter: async (filter, order, limit) => base44.entities.CarteiraCliente.filter(filter, order, limit),
      create: async (data) => base44.entities.CarteiraCliente.create(data),
      update: async (id, data) => base44.entities.CarteiraCliente.update(id, data),
      get: async (id) => base44.entities.CarteiraCliente.get(id),
      delete: async (id) => {
        await supabase.from('clientes').delete().eq('id', id);
        return { success: true };
      }
    },

    ExecutionOpportunity: {
      filter: async (filter) => {
        const me = await base44.auth.me().catch(() => ({ id: '' }));
        const items = getLocal('ExecutionOpportunity', me.id);
        return items.filter(r => matchQuery(r, filter));
      },
      create: async (data) => {
        const me = await base44.auth.me().catch(() => ({ id: '' }));
        const items = getLocal('ExecutionOpportunity', me.id);
        const newItem = { id: Math.random().toString(36).slice(2), ...data, created_date: new Date().toISOString() };
        setLocal('ExecutionOpportunity', [...items, newItem]);
        return newItem;
      },
      update: async (id, data) => {
        const me = await base44.auth.me().catch(() => ({ id: '' }));
        const items = getLocal('ExecutionOpportunity', me.id);
        const updated = items.map(item => item.id === id ? { ...item, ...data } : item);
        setLocal('ExecutionOpportunity', updated);
        return updated.find(item => item.id === id);
      }
    },

    AtividadeExecucao: {
      filter: async (filter) => {
        const me = await base44.auth.me().catch(() => ({ id: '' }));
        const items = getLocal('AtividadeExecucao', me.id);
        return items.filter(r => matchQuery(r, filter));
      },
      create: async (data) => {
        const me = await base44.auth.me().catch(() => ({ id: '' }));
        const items = getLocal('AtividadeExecucao', me.id);
        const newItem = { id: Math.random().toString(36).slice(2), ...data, created_date: new Date().toISOString() };
        setLocal('AtividadeExecucao', [...items, newItem]);
        return newItem;
      },
      update: async (id, data) => {
        const me = await base44.auth.me().catch(() => ({ id: '' }));
        const items = getLocal('AtividadeExecucao', me.id);
        const updated = items.map(item => item.id === id ? { ...item, ...data } : item);
        setLocal('AtividadeExecucao', updated);
        return updated.find(item => item.id === id);
      }
    },

    LiberacaoFechamento: {
      filter: async (filter) => {
        const me = await base44.auth.me();
        const { data: rows } = await supabase
          .from('fechamento_liberacoes')
          .select('*')
          .eq('vendedor_id', me.id);

        const mapped = (rows || []).map(r => ({
          id: r.id,
          vendedor_id: r.vendedor_id,
          data_fechamento: r.data_fechamento,
          status_solicitacao: r.status === 'Liberado' ? 'Liberado' : 'Solicitado',
          status: r.status
        }));
        return mapped.filter(r => matchQuery(r, filter));
      },
      create: async (data) => {
        const me = await base44.auth.me();
        
        // Fetch active store for vendor
        const { data: vinculos } = await supabase
          .from('vinculos_loja')
          .select('store_id')
          .eq('user_id', me.id)
          .eq('is_active', true)
          .limit(1);
        const storeId = vinculos?.[0]?.store_id;

        const { data: created, error } = await supabase
          .from('fechamento_liberacoes')
          .insert({
            vendedor_id: me.id,
            store_id: storeId,
            data_fechamento: data.data_fechamento,
            status: 'Solicitado',
            token_expira_em: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            token_hash: Math.random().toString(36).slice(2)
          })
          .select()
          .single();

        if (error) throw error;
        return {
          id: created.id,
          vendedor_id: created.vendedor_id,
          data_fechamento: created.data_fechamento,
          status_solicitacao: 'Solicitado',
          status: 'Solicitado'
        };
      }
    },

    RegularizacaoFechamento: {
      filter: async (filter) => {
        const items = getLocal('RegularizacaoFechamento');
        return items.filter(r => matchQuery(r, filter));
      },
      create: async (data) => {
        const items = getLocal('RegularizacaoFechamento');
        const newItem = { id: Math.random().toString(36).slice(2), ...data, status_solicitacao: 'Solicitado', created_date: new Date().toISOString() };
        setLocal('RegularizacaoFechamento', [...items, newItem]);
        return newItem;
      }
    },

    D1AuditLog: {
      create: async (data) => {
        const items = getLocal('D1AuditLog');
        const newItem = { id: Math.random().toString(36).slice(2), ...data, created_date: new Date().toISOString() };
        setLocal('D1AuditLog', [...items, newItem]);
        return newItem;
      }
    },

    PDI: {
      list: async () => {
        const me = await base44.auth.me();
        const { data: rows } = await supabase
          .from('pdis')
          .select('*')
          .eq('seller_id', me.id)
          .order('created_at', { ascending: false });

        return (rows || []).map(r => ({
          id: r.id,
          short_term_goal: r.meta_6m || '',
          medium_term_goal: r.meta_12m || '',
          long_term_goal: r.meta_24m || '',
          tech_planejamento: r.comp_organizacao || 5,
          tech_atendimento: r.comp_demonstracao || 5,
          tech_agendamento: r.comp_negociacao || 5,
          tech_fechamento: r.comp_fechamento || 5,
          tech_carteira: r.comp_crm || 5,
          tech_midias: r.comp_digital || 5,
          tech_prospeccao: r.comp_prospeccao || 5,
          tech_avaliacao: r.comp_abordagem || 5,
          tech_financiamentos: r.comp_negociacao || 5,
          tech_processos: r.comp_disciplina || 5,
          behav_pontualidade: r.comp_disciplina || 5,
          behav_urgencia: r.comp_disciplina || 5,
          behav_iniciativa: r.comp_prospeccao || 5,
          behav_organizacao: r.comp_organizacao || 5,
          behav_lideranca: r.comp_produto || 5,
          behav_relacionamento: r.comp_crm || 5,
          behav_persistencia: r.comp_negociacao || 5,
          behav_resiliencia: r.comp_negociacao || 5
        }));
      }
    },

    Feedback: {
      filter: async (filter) => {
        const me = await base44.auth.me();
        const { data: rows } = await supabase
          .from('devolutivas')
          .select('*')
          .eq('seller_id', me.id);

        const mapped = (rows || []).map(r => ({
          id: r.id,
          type: r.caso_motivo || 'Desenvolvimento',
          competency: r.action || 'Atendimento',
          message: r.notes || r.attention_points || r.positives || '',
          responsible: 'Gestor Comercial',
          acknowledged: r.acknowledged || false,
          user_comment: r.seller_comment || '',
          acknowledged_date: r.acknowledged_at
        }));

        return mapped.filter(r => matchQuery(r, filter));
      },
      list: async (order, limit) => {
        const list = await base44.entities.Feedback.filter(null);
        const sorted = sortRows(list, order);
        return limit ? sorted.slice(0, limit) : sorted;
      },
      update: async (id, data) => {
        const payload = {};
        if (data.acknowledged !== undefined) payload.acknowledged = data.acknowledged;
        if (data.user_comment !== undefined) {
          payload.seller_comment = data.user_comment;
          payload.seller_comment_at = new Date().toISOString();
        }
        if (data.acknowledged_date !== undefined) payload.acknowledged_at = data.acknowledged_date;

        const { data: updated } = await supabase
          .from('devolutivas')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        return updated;
      }
    },

    Training: {
      filter: async (filter, order, limit) => {
        const { data: rows } = await supabase
          .from('treinamentos')
          .select('*')
          .eq('active', true);

        const mapped = (rows || []).map(r => ({
          id: r.id,
          title: r.title,
          description: r.description || '',
          category: r.type || 'Atendimento',
          level: r.target_audience || 'N1 Iniciante',
          duration_minutes: r.duration_minutes || 10,
          content_url: r.video_url || '',
          thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
          is_live: r.type === 'live' || r.published_at ? true : false,
          live_date: r.published_at,
          recording_url: r.video_url || ''
        }));

        const filtered = mapped.filter(r => matchQuery(r, filter));
        const sorted = sortRows(filtered, order);
        return limit ? sorted.slice(0, limit) : sorted;
      },
      list: async (order, limit) => base44.entities.Training.filter(null, order, limit)
    },

    TrainingProgress: {
      list: async () => {
        const me = await base44.auth.me();
        const { data: rows } = await supabase
          .from('progresso_treinamentos')
          .select('*')
          .eq('user_id', me.id);

        return (rows || []).map(r => ({
          id: r.id,
          training_id: r.training_id,
          completed: r.status === 'completed' || r.status === 'watched',
          quiz_score: 100,
          hours_studied: 0.5,
          attended_live: true
        }));
      }
    },

    PoliticaRemuneracao: {
      filter: async (filter) => {
        const list = [
          {
            id: 'pol_vendedor',
            nome: 'Comissão Padrão MX',
            descricao: 'Política de remuneração fixa mais faixas progressivas',
            tipo_remuneracao: 'Faixas de Comissão',
            valor_base: 2000,
            status: 'Ativa'
          }
        ];
        return list.filter(r => matchQuery(r, filter));
      },
      list: async (order, limit) => {
        const list = await base44.entities.PoliticaRemuneracao.filter(null);
        return limit ? list.slice(0, limit) : list;
      }
    },

    FaixaComissao: {
      filter: async (filter) => {
        const list = [
          { id: 'fx1', politica_id: 'pol_vendedor', nome: 'Nível 1 (Até 5 vendas)', meta_min_unidades: 0, meta_max_unidades: 5, comissao_por_unidade: 400, status: 'Ativa' },
          { id: 'fx2', politica_id: 'pol_vendedor', nome: 'Nível 2 (6 a 10 vendas)', meta_min_unidades: 6, meta_max_unidades: 10, comissao_por_unidade: 550, status: 'Ativa' },
          { id: 'fx3', politica_id: 'pol_vendedor', nome: 'Nível 3 (11 a 15 vendas)', meta_min_unidades: 11, meta_max_unidades: 15, comissao_por_unidade: 700, status: 'Ativa' },
          { id: 'fx4', politica_id: 'pol_vendedor', nome: 'Nível 4 (Mais de 15 vendas)', meta_min_unidades: 16, meta_max_unidades: 99, comissao_por_unidade: 900, status: 'Ativa' }
        ];
        return list.filter(r => matchQuery(r, filter));
      },
      list: async (order, limit) => {
        const list = await base44.entities.FaixaComissao.filter(null);
        return limit ? list.slice(0, limit) : list;
      }
    },

    PremiacaoRemuneracao: {
      filter: async (filter) => {
        const list = [
          { id: 'pr1', politica_id: 'pol_vendedor', nome: 'Superação 10 Vendas', meta_unidades: 10, valor_premio: 1000, status: 'Ativa' },
          { id: 'pr2', politica_id: 'pol_vendedor', nome: 'Superação 15 Vendas', meta_unidades: 15, valor_premio: 2000, status: 'Ativa' }
        ];
        return list.filter(r => matchQuery(r, filter));
      },
      list: async (order, limit) => {
        const list = await base44.entities.PremiacaoRemuneracao.filter(null);
        return limit ? list.slice(0, limit) : list;
      }
    },

    BonificacaoRemuneracao: {
      filter: async (filter) => {
        const list = [
          { id: 'bn1', politica_id: 'pol_vendedor', nome: 'Bônus de Disciplina', descricao: 'Pontuação de disciplina no fechamento acima de 90%', valor_bonus: 500, status: 'Ativa' }
        ];
        return list.filter(r => matchQuery(r, filter));
      },
      list: async (order, limit) => {
        const list = await base44.entities.BonificacaoRemuneracao.filter(null);
        return limit ? list.slice(0, limit) : list;
      }
    },

    HistoricoRemuneracao: {
      filter: async (filter) => {
        const me = await base44.auth.me();
        const list = [
          { id: 'hist_1', vendedor_id: me.id, mes_competencia: moment().subtract(1, 'month').format('YYYY-MM'), fixo: 2000, comissao: 4500, premios: 1000, bonus: 500, total: 8000, status: 'Pago' },
          { id: 'hist_2', vendedor_id: me.id, mes_competencia: moment().subtract(2, 'month').format('YYYY-MM'), fixo: 2000, comissao: 3800, premios: 0, bonus: 500, total: 6300, status: 'Pago' }
        ];
        return list.filter(r => matchQuery(r, filter));
      },
      list: async (order, limit) => {
        const list = await base44.entities.HistoricoRemuneracao.filter(null);
        const sorted = sortRows(list, order);
        return limit ? sorted.slice(0, limit) : sorted;
      },
      create: async (data) => {
        return { id: Math.random().toString(36).slice(2), ...data };
      }
    },

    UserProfile: {
      filter: async (filter) => {
        const me = await base44.auth.me();
        const { data } = await supabase.from('usuarios').select('*').eq('id', me.id).single();
        const list = [{
          id: me.id,
          name: data?.name || me.name,
          email: data?.email || me.email,
          role: data?.role || me.role,
          avatar_url: data?.avatar_url || me.avatar_url,
          created_by_id: me.id,
          start_hour: '08:00',
          end_hour: '18:00',
          target_salary: 5000
        }];
        return list.filter(r => matchQuery(r, filter));
      },
      list: async () => {
        return base44.entities.UserProfile.filter(null);
      },
      create: async (data) => {
        return { id: Math.random().toString(36).slice(2), ...data };
      },
      update: async (id, data) => {
        return { id, ...data };
      }
    },

    ActionPlan: {
      filter: async (filter) => {
        const items = getLocal('ActionPlan');
        return items.filter(r => matchQuery(r, filter));
      },
      list: async (order, limit) => {
        const items = getLocal('ActionPlan');
        const sorted = sortRows(items, order);
        return limit ? sorted.slice(0, limit) : sorted;
      },
      create: async (data) => {
        const items = getLocal('ActionPlan');
        const newItem = { id: Math.random().toString(36).slice(2), ...data, created_date: new Date().toISOString() };
        setLocal('ActionPlan', [...items, newItem]);
        return newItem;
      },
      update: async (id, data) => {
        const items = getLocal('ActionPlan');
        const updated = items.map(item => item.id === id ? { ...item, ...data } : item);
        setLocal('ActionPlan', updated);
        return updated.find(item => item.id === id);
      }
    },

    User: {
      list: async () => {
        const { data: rows } = await supabase.from('usuarios').select('id, name, email, role, avatar_url');
        return (rows || []).map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          avatar_url: r.avatar_url
        }));
      }
    },

    RankingConfig: {
      list: async () => [{ id: 'rc_1', mes_competencia: moment().format('YYYY-MM'), ativo: true }]
    },

    BonificacaoRanking: {
      list: async () => [
        { id: 'br_1', posicao: 1, valor_premio: 1500, descricao: '1º Lugar Geral Concessionária' },
        { id: 'br_2', posicao: 2, valor_premio: 1000, descricao: '2º Lugar Geral Concessionária' },
        { id: 'br_3', posicao: 3, valor_premio: 500, descricao: '3º Lugar Geral Concessionária' }
      ]
    },

    MetaVendedor: {
      list: async () => {
        const me = await base44.auth.me();
        return [{ id: 'mv_1', vendedor_id: me.id, meta_faturamento: 120000, meta_quantidade: 15, mes_competencia: moment().format('YYYY-MM') }];
      }
    },

    Appointment: {
      filter: async (filter) => {
        const me = await base44.auth.me();
        const { data: rows } = await supabase
          .from('agendamentos')
          .select('*, clientes(*)')
          .eq('seller_user_id', me.id);
        
        const mapped = (rows || []).map(r => ({
          id: r.id,
          cliente_id: r.cliente_id,
          vendedor_id: r.seller_user_id,
          loja_id: r.loja_id,
          date: moment(r.data_hora).format('YYYY-MM-DD'),
          time: moment(r.data_hora).format('HH:mm'),
          tipo: r.tipo,
          status: r.status,
          nome_cliente: r.clientes?.nome || ''
        }));
        return mapped.filter(r => matchQuery(r, filter));
      }
    },

    EventoComercial: {
      filter: async (filter) => {
        const me = await base44.auth.me().catch(() => ({ id: '' }));
        const items = getLocal('EventoComercial', me.id);
        return items.filter(r => matchQuery(r, filter));
      },
      create: async (data) => {
        const me = await base44.auth.me().catch(() => ({ id: '' }));
        const items = getLocal('EventoComercial', me.id);
        const newItem = { id: Math.random().toString(36).slice(2), ...data, created_date: new Date().toISOString() };
        setLocal('EventoComercial', [...items, newItem]);
        return newItem;
      },
      update: async (id, data) => {
        const me = await base44.auth.me().catch(() => ({ id: '' }));
        const items = getLocal('EventoComercial', me.id);
        const updated = items.map(item => item.id === id ? { ...item, ...data } : item);
        setLocal('EventoComercial', updated);
        return updated.find(item => item.id === id);
      }
    }
  }
};
