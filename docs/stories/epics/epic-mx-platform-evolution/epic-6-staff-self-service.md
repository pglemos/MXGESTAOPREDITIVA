# Epic 6: Cadastro Self-Service de Quadro de Funcionários

**Epic ID:** EPIC-MX-EVOL-06
**Status:** **BLOCKED — Aguardando onboarding Meta WhatsApp Cloud API**
**Onda:** B (Pós-onboarding)
**Estimativa:** 8-10 dias úteis (após desbloqueio)
**Owner:** @pm (Morgan)
**Implementação:** @architect (Aria) + @dev (Dex) + @data-engineer (Dara)
**Origem:** Tarefa original #2

---

## Objetivo

Permitir que o admin master gere e envie um **link tokenizado** para a loja (e-mail e/ou WhatsApp)
através do qual o gerente/dono atualiza o quadro de funcionários (adicionar, editar funções, remover)
sem precisar de login no sistema, com validade limitada e auditoria completa.

---

## Bloqueadores Atuais

Esta epic **não pode iniciar implementação** até os seguintes pré-requisitos estarem completos:

### Onboarding Meta WhatsApp Cloud API

- [ ] Conta Meta Business verificada — [business.facebook.com](https://business.facebook.com)
- [ ] App criado em [developers.facebook.com](https://developers.facebook.com) com produto "WhatsApp" habilitado
- [ ] Número de telefone dedicado cadastrado (não pode estar em uso no WhatsApp normal)
- [ ] Display Name aprovado pela Meta (24-48h)
- [ ] Verificação fiscal CNPJ concluída (3-5 dias úteis)
- [ ] Template `staff_update_link` aprovado pela Meta (categoria UTILITY, 24-72h)
  - Conteúdo sugerido: `Olá {{1}}, você foi convidado(a) a atualizar o quadro de funcionários da loja {{2}}. Acesse o link seguro: {{3}} (válido por 7 dias).`
- [ ] System User Token de longa duração gerado
- [ ] Variáveis adicionadas ao Vercel + Supabase secrets (ver lista em [README.md](./README.md))

### Decisão de Provider de E-mail

- [x] Resend já instalado (`resend@^6.10.0` no package.json)
- [ ] Domínio remetente configurado e verificado no Resend (ex: `noreply@mxperformance.com.br`)
- [ ] Template HTML aprovado pelo PO

---

## Stories (Esboço — detalhes serão refinados após desbloqueio)

### Fase A — Backend / Infra

#### Story 6.1: Migration `staff_update_tokens`

Schema esperado:
```sql
CREATE TABLE staff_update_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,                  -- nanoid 32 chars URL-safe
  created_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,             -- now() + 7 days
  used_at TIMESTAMPTZ,
  ip_used INET,
  user_agent_used TEXT,
  channel TEXT CHECK (channel IN ('email','whatsapp','manual')),
  recipient TEXT NOT NULL,                     -- email ou telefone E.164
  payload_received JSONB,                      -- snapshot do que foi enviado
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Critérios de Aceitação:
- [ ] Migration aplicada
- [ ] RLS: somente `admin` pode INSERT/SELECT; UPDATE de `used_at` via service_role apenas
- [ ] Índices em `token`, `store_id`, `expires_at`

#### Story 6.2: Edge function `generate-staff-update-link`
- [ ] Recebe `{ store_id, channel, recipient }` autenticado como admin
- [ ] Gera token único (nanoid 32) com TTL 7 dias
- [ ] Retorna URL `https://mxperformance.vercel.app/atualizar-quadro/{token}`

#### Story 6.3: Edge function `staff-update-submit`
- [ ] Endpoint público (com rate limit) que valida token
- [ ] Recebe payload de funcionários (array de `{ name, role, phone, email, action }`)
- [ ] Aplica mudanças idempotentemente em `users` e `store_memberships`
- [ ] Marca token como usado (`used_at`)

### Fase B — Frontend Público

#### Story 6.4: Rota `/atualizar-quadro/:token`
- [ ] Página pública (sem auth) — adicionar em [src/App.tsx](../../../../src/App.tsx)
- [ ] Valida token via edge function antes de renderizar form
- [ ] Mostra estado atual do quadro (somente leitura)
- [ ] Form para adicionar/editar/remover membros
- [ ] Confirmação antes de submit
- [ ] Estado de sucesso + bloqueio de re-uso do link

### Fase C — Canais de Envio

#### Story 6.5: Envio por E-mail (Resend)
- [ ] Edge function `send-staff-update-email` chama Resend API
- [ ] Template HTML em `supabase/functions/_shared/templates/staff-update.html`
- [ ] Logs em tabela `email_send_log`

#### Story 6.6: Envio por WhatsApp (Meta Cloud API)
- [ ] Edge function `send-staff-update-whatsapp`
- [ ] Usa template aprovado `staff_update_link` com 3 variáveis
- [ ] Webhook `/api/whatsapp/webhook` opcional para receber `delivered`/`read`/`failed`
- [ ] Logs em tabela `whatsapp_send_log`

#### Story 6.7: UI no Admin Master
- [ ] Botão "Enviar link de atualização" em cada loja em [src/pages/Lojas.tsx](../../../../src/pages/Lojas.tsx)
- [ ] Modal com seleção de canal (E-mail OU WhatsApp) e destinatário
- [ ] Histórico dos últimos envios para a loja (com status)

---

## Definition of Done

- [ ] Todos os bloqueadores Meta resolvidos
- [ ] 7 stories implementadas e aprovadas em QA
- [ ] Teste E2E completo: admin gera link → recebe via WhatsApp → atualiza quadro → mudança reflete no app
- [ ] Documentação operacional em `docs/operations/staff-self-service-runbook.md`

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Aprovação Meta demora mais que 5 dias | Lançar Onda A primeiro; lançar Fase A+B+C5 (só email) antes do WhatsApp |
| Token vazado em screenshot/captura de e-mail | TTL curto (7d) + uso único + rate-limit |
| Submit malicioso via API pública | Rate limit por IP + CAPTCHA opcional + validação de schema rígida |
| Custo WhatsApp por conversa | Templates UTILITY são mais baratos; medir volume após primeiro mês |
