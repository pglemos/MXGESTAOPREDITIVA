# Plano de Implementação: Fidelidade 100% Elite MX

## Objetivo
Zerar as pendências do "Modelo Padrão de Relatórios de Visita" e do "Relatório de Choque", garantindo conformidade visual e técnica total.

## Alterações Propostas

### 1. Evidências Visuais no PDF (VisitReportTemplate)
- [ ] Alterar `VisitReportTemplate.tsx` para carregar e exibir imagens de anexos.
- [ ] Implementar grid de evidências no final do documento PDF.

### 2. ROI Financeiro Profundo (ConsultingROIView)
- [ ] Expandir o gráfico de evolução para incluir **Margem Líquida** e **Idade de Estoque**.
- [ ] Adicionar cards comparativos de lucratividade (Antes vs Depois).

### 3. Assinatura do Vendedor no PDI
- [ ] Adicionar campo `seller_acknowledged_at` na tabela de PDIs.
- [ ] Criar botão "Assinatura do Vendedor" na interface de PDIs que gera um PIN de validação ou carimbo de data.

### 4. Objetivo do Próximo Ciclo
- [ ] Adicionar campo `next_cycle_goal` no cockpit de conclusão da visita.
- [ ] Exibir este objetivo no PDF gerado.

## Verificação e Testes
- [ ] **Typecheck:** Garantir que as novas colunas e estados não quebram o TS.
- [ ] **Validação via Navegador:**
    - Login com credenciais fornecidas.
    - Execução de visita com upload de imagem.
    - Geração de PDF e verificação visual das fotos no arquivo.
    - Verificação do gráfico de ROI com novas métricas.

## Ordem de Execução
1. Atualizar banco de dados (colunas novas).
2. Atualizar interfaces de dados (types).
3. Implementar mudanças no Frontend (Vercel + Supabase).
4. Teste final no Chrome DevTools.
