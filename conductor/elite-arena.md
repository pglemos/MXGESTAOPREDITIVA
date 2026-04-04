# Implementation Plan: Meritocracia de Elite & Reparo Forense (story-elite-arena)

## Objective
Transformar a Home do Vendedor em uma **Arena de Performance** e elevar a precisão do motor de reprocessamento para nível forense.

---

## Key Files
- `src/pages/VendedorHome.tsx`: Refatoração da Home (Meritocracia).
- `supabase/migrations/20260403000012_fix_reprocess_ids.sql`: Ajuste na RPC de processamento.

---

## Implementation Steps

### Phase 1: Arena de Performance (Individual)
1. **Radar de Elite**:
   - Inserir mini-seção de ranking comparativo: "Quem está acima de você" e "Quem está abaixo".
   - Criar o visual de "Caça à Próxima Posição".
2. **Visual de Impacto**:
   - Trocar cards genéricos por visual de "Cockpit de Caça": Mais contraste, fontes maiores para números de venda e projeção.

### Phase 2: Engine Forense (Backend)
1. **RPC Update**:
   - Modificar `process_import_data` para priorizar localização por ID UUID e adicionar fallback para busca por email/nome.
   - Adicionar trava de segurança: Impedir importação se a data de referência for superior a `now()`.

### Phase 3: Estabilização
1. **Auditoria Visual**: Verificar se o vendedor sente a "pressão" saudável do ranking ao abrir o app.
2. **Teste de Carga**: Simular importação de 1000 registros para validar performance da RPC.

---

## Verification & Testing
- [ ] **Teste de Ranking**: Verificar se o componente de Arena reflete corretamente os vizinhos de posição.
- [ ] **Auditoria de Banco**: Validar se o log de erros da importação captura falhas de cast de data.
