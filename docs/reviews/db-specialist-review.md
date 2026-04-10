# Database Specialist Review (@data-engineer)

## 🎯 Respostas às Perguntas da Arquitetura
- **Remoção de Legado**: Recomendo manter as colunas legadas de `daily_checkins` por 30 dias após o deploy da nova UI. Após esse período de "grace", devemos remover as colunas e o trigger `sync_daily_checkins_canonical` para reduzir a latência de escrita.
- **Segurança de Feedbacks**: Atualmente, qualquer gerente de uma loja pode ver os feedbacks de todos os vendedores daquela loja. Se a intenção for privacidade entre gerentes, precisamos adicionar uma cláusula `gerente_id = auth.uid()` na policy `role_matrix_feedbacks_select`.

---

## 🔍 Validação de Débitos Técnicos

### DB-01: Permissividade RLS `daily_checkins` (Crítico)
- **Validação**: O risco é real. Como o `SELECT` está aberto para todos os autenticados, um usuário mal-intencionado com acesso ao console do browser pode baixar a produção de toda a rede.
- **Mitigação Proposta**: Restringir o `SELECT` para `(is_admin()) OR (is_member_of(store_id))`. Isso permite que o vendedor veja sua loja e o admin veja tudo, mas impede que um vendedor da Loja A veja a Loja B via API.

### DB-02: Triggers de Compatibilidade Legada (Baixo)
- **Validação**: O esforço para remover é baixo, mas o risco de quebrar integrações não mapeadas é médio. 
- **Ação**: Mapear todos os consumidores do Supabase (incluindo possíveis scripts Python/Automation externos) antes da limpeza.

### DB-03: Integridade PDI (Novo)
- **Validação**: Identifiquei que as tabelas `pdi_objetivos_pessoais` e `pdi_metas` não possuem `store_id`, dependendo inteiramente do `sessao_id`. 
- **Risco**: Se uma sessão for movida de loja (raro, mas possível), o vínculo geográfico se perde. 
- **Recomendação**: Adicionar `store_id` (denormalizado) para facilitar auditorias por unidade.

---

## 📈 Priorização Dara (Engenheira de Dados)
1. **Fix DB-01 (RLS Permissivo)**: Imediato.
2. **Implementar denormalização de `store_id` no PDI**: Alta.
3. **Plano de Purge de Legado**: Baixa.

Salve em: docs/reviews/db-specialist-review.md
