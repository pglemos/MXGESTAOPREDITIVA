import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replaceAll('"', '');
const senhaPadraoTeste = process.env.E2E_AUTH_PASSWORD || 'Mx#2026!';

function novoClienteAnonimo() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function novoClienteServico() {
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY é obrigatória para limpar dados E2E.');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function autenticarAdmin() {
  const client = novoClienteAnonimo();
  const { data, error } = await client.auth.signInWithPassword({
    email: 'admin@mxgestaopreditiva.com.br',
    password: senhaPadraoTeste,
  });

  expect(error).toBeNull();
  expect(data.user?.id).toBeTruthy();
  return { client, userId: data.user!.id };
}

async function removerCaminhos(client: SupabaseClient, caminhos: string[]) {
  if (!caminhos.length) return;
  await client.storage.from('evidencias-consultoria').remove(caminhos);
}

test.describe('Consultoria: evidência obrigatória de visita', () => {
  test('bloqueia conclusão sem evidência e conclui após upload, listagem e remoção válidos', async () => {
    const servico = novoClienteServico();
    const { client: admin, userId } = await autenticarAdmin();
    const marcador = `e2e-evidencia-${Date.now()}`;
    const caminhosCriados: string[] = [];
    let clienteId: string | null = null;
    let visitaId: string | null = null;

    try {
      const { data: cliente, error: erroCliente } = await servico
        .from('clientes_consultoria')
        .insert({
          name: `Cliente ${marcador}`,
          legal_name: `Cliente ${marcador} LTDA`,
          product_name: 'PMR E2E',
          status: 'ativo',
          program_template_key: 'pmr_9',
          slug: marcador,
          created_by: userId,
        })
        .select('id')
        .single();
      expect(erroCliente).toBeNull();
      clienteId = cliente!.id;

      const { data: visita, error: erroVisita } = await admin
        .from('visitas_consultoria')
        .insert({
          client_id: clienteId,
          visit_number: 1,
          scheduled_at: new Date().toISOString(),
          duration_hours: 2,
          modality: 'presencial',
          status: 'em_andamento',
          consultant_id: userId,
          objective: 'Validação E2E de evidência obrigatória',
          checklist_data: [{ task: 'Validar evidência obrigatória', completed: true }],
        })
        .select('id')
        .single();
      expect(erroVisita).toBeNull();
      visitaId = visita!.id;

      const { error: erroSemEvidencia } = await admin.rpc('concluir_visita_consultoria', {
        p_visita_id: visitaId,
      });
      expect(erroSemEvidencia?.message || '').toContain('exige evidencia');

      const caminhoTemporario = `${clienteId}/visita-1/${marcador}-temporario.txt`;
      caminhosCriados.push(caminhoTemporario);
      const { error: erroUploadTemporario } = await admin.storage
        .from('evidencias-consultoria')
        .upload(caminhoTemporario, new Blob(['evidencia temporaria'], { type: 'text/plain' }), {
          contentType: 'text/plain',
        });
      expect(erroUploadTemporario).toBeNull();

      const { data: evidenciaTemporaria, error: erroInsertTemporario } = await admin
        .from('evidencias_visita')
        .insert({
          visita_id: visitaId,
          tipo: 'documento',
          nome_arquivo: 'evidencia-temporaria.txt',
          caminho_storage: caminhoTemporario,
          content_type: 'text/plain',
          tamanho_bytes: 20,
          enviado_por: userId,
        })
        .select('id, caminho_storage')
        .single();
      expect(erroInsertTemporario).toBeNull();

      const { data: evidenciasListadas, error: erroListagem } = await admin
        .from('evidencias_visita')
        .select('id, caminho_storage')
        .eq('visita_id', visitaId);
      expect(erroListagem).toBeNull();
      expect(evidenciasListadas?.some((item) => item.id === evidenciaTemporaria!.id)).toBe(true);

      const { error: erroRemoveStorage } = await admin.storage
        .from('evidencias-consultoria')
        .remove([caminhoTemporario]);
      expect(erroRemoveStorage).toBeNull();
      const { error: erroDeleteEvidencia } = await admin
        .from('evidencias_visita')
        .delete()
        .eq('id', evidenciaTemporaria!.id);
      expect(erroDeleteEvidencia).toBeNull();

      const { count: evidenciasDepoisRemocao, error: erroContagem } = await admin
        .from('evidencias_visita')
        .select('id', { count: 'exact', head: true })
        .eq('visita_id', visitaId);
      expect(erroContagem).toBeNull();
      expect(evidenciasDepoisRemocao).toBe(0);

      const caminhoFinal = `${clienteId}/visita-1/${marcador}-final.txt`;
      caminhosCriados.push(caminhoFinal);
      const { error: erroUploadFinal } = await admin.storage
        .from('evidencias-consultoria')
        .upload(caminhoFinal, new Blob(['evidencia final'], { type: 'text/plain' }), {
          contentType: 'text/plain',
        });
      expect(erroUploadFinal).toBeNull();

      const { error: erroInsertFinal } = await admin.from('evidencias_visita').insert({
        visita_id: visitaId,
        tipo: 'documento',
        nome_arquivo: 'evidencia-final.txt',
        caminho_storage: caminhoFinal,
        content_type: 'text/plain',
        tamanho_bytes: 15,
        enviado_por: userId,
      });
      expect(erroInsertFinal).toBeNull();

      const { data: visitaConcluida, error: erroComEvidencia } = await admin.rpc('concluir_visita_consultoria', {
        p_visita_id: visitaId,
      });
      expect(erroComEvidencia).toBeNull();
      expect(visitaConcluida?.status).toBe('concluida');
    } finally {
      await removerCaminhos(servico, caminhosCriados);
      if (visitaId) await servico.from('evidencias_visita').delete().eq('visita_id', visitaId);
      if (visitaId) await servico.from('visitas_consultoria').delete().eq('id', visitaId);
      if (clienteId) await servico.from('clientes_consultoria').delete().eq('id', clienteId);
    }
  });
});
