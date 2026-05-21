# PRD — MX Gestão Preditiva (Aplicativo Android Nativo)

**Versão:** 1.0
**Data:** 2026-05-21
**Autor:** @pm (Morgan) + @ux-design-expert (Uma) + @architect (Aria)
**Status:** Draft — pendente revisão de board
**Audiência:** Engenharia mobile, Product, UX, Stakeholders MX
**Documento relacionado:** `docs/prd/technical-debt-assessment.md` (sistema web atual)

---

## 1. Visão Geral

### 1.1 Resumo Executivo

O MX Gestão Preditiva é uma plataforma SaaS de gestão de performance comercial para redes de varejo, atualmente disponível como aplicação web (React 19 + Supabase). Este PRD descreve a especificação completa do **aplicativo Android nativo**, que terá paridade funcional com a web e diferenciais mobile-first: notificações push, modo offline, geolocalização, scanner de documentos e biometria.

### 1.2 Objetivo

Entregar um aplicativo Android nativo que:

- **Reduza fricção operacional** do vendedor no chão de loja (lançamento diário em <60s)
- **Habilite gestão remota** para gerentes e donos (KPIs em tempo real)
- **Centralize visitas e auditorias** do consultor MX (com offline-first)
- **Mantenha conformidade LGPD** com mesmo nível da web (RLS, audit log, consent)

### 1.3 Métricas de Sucesso (12 meses pós-launch)

| Métrica | Baseline (web) | Meta Android |
|---------|:---:|:---:|
| Tempo médio para lançar checkin | 90s | **<60s** |
| Taxa de checkin no prazo (até 09:45) | ~78% | **>92%** |
| DAU/MAU (vendedores) | 0.45 | **>0.65** |
| Crashes free rate | n/a | **>99.5%** |
| Cold start time (Moto G low-end) | n/a | **<2s** |
| Tempo para primeira visita consultor (após login) | 4min | **<90s** |
| App Store rating | n/a | **>4.5** |
| Adoção em 90 dias da rede ativa | n/a | **>85%** |
| MTTR de incidentes via Sentry | 30min | **<15min** |

### 1.4 Não-Objetivos (Out of Scope v1)

- ❌ App iOS (roadmap futuro Sprint 5+)
- ❌ Versão tablet otimizada (foco mobile, tablet roda layout phone)
- ❌ Modo branco/personalização white-label
- ❌ Integração com Whatsapp Business API
- ❌ Pagamentos in-app
- ❌ Marketplace de treinamentos pagos

---

## 2. Personas

### 2.1 Vendedor (Ana — 24 anos, loja física, baixa familiaridade técnica)

**Contexto:** trabalha em uma loja de varejo (rede de 5-50 lojas). Atende clientes presencialmente, faz agendamentos, registra vendas. Tem celular Android entry-level (Moto G ou similar), conexão 4G instável.

**Dor principal:** "perco tempo demais lançando meus números no fim do dia / esqueço do prazo de 09:45 e perco bônus".

**Cenários de uso:**
- Checkin diário às 7h45 (antes da abertura) — leads do dia anterior, agendamentos, vendas
- Ver ranking semanal vs colegas
- Consultar treinamentos PDI
- Receber feedback do gerente
- Ver metas atualizadas em tempo real

**Frequência:** 5x/dia (peek check, checkin, push notifications, ranking, feedback)
**Conexão:** 4G/wifi loja (instável)
**Hardware típico:** Moto G (4-6GB RAM), Android 13+, tela 6"

### 2.2 Gerente de Loja (Bruno — 38 anos, gerente de 1 loja, gestor pragmático)

**Contexto:** gerencia uma loja com 3-15 vendedores. Responsável por bater metas mensais, dar feedback diário, escalar problemas para o dono / consultor MX.

**Dor principal:** "preciso ver no celular se a equipe lançou tudo antes do prazo / quero dar feedback rápido sem abrir notebook".

**Cenários de uso:**
- Dashboard da loja matinal (9h)
- Validar lançamentos da equipe (09:45)
- Enviar feedback diário (15min/dia)
- Ver ranking da loja vs rede
- Acompanhar PDIs em andamento
- Aprovar pré-cadastros novos vendedores

**Frequência:** 8-10x/dia
**Hardware típico:** mid-tier Android (Samsung A-series ou similar)

### 2.3 Dono de Loja (Carlos — 45 anos, multi-loja, foco em ROI)

**Contexto:** dono de 1-5 lojas. Quer visão consolidada de performance, custos, ROI. Não opera no dia a dia — supervisiona via app.

**Dor principal:** "preciso de visão consolidada multi-loja sem ter que abrir planilha / saber rápido qual loja está em risco de não bater meta".

**Cenários de uso:**
- Dashboard executivo multi-loja (manhã + final do dia)
- Comparativo entre lojas
- Alertas de exceção (loja abaixo de X% da meta)
- Aprovar criação/encerramento de lojas
- Aprovar contratação de vendedores
- Aprovar metas mensais propostas pelo consultor

**Frequência:** 2-3x/dia
**Hardware típico:** Android premium (Galaxy S, Pixel)

### 2.4 Admin MX / Consultor (Daniela — 32 anos, consultora externa, 8-12 contas)

**Contexto:** consultora MX que atende 8-12 redes/lojas como cliente. Visita lojas presencialmente, faz diagnóstico, propõe metas, ajusta regras. Trabalha em campo (carro, lojas, café).

**Dor principal:** "preciso registrar visita no momento (não no final do dia) / preciso ver tudo de todas as lojas dos meus clientes / às vezes não tenho 4G".

**Cenários de uso:**
- Agendar visita
- Executar visita presencial (formulário longo, com fotos, geolocalização)
- Subir relatório (offline → sync quando volta a internet)
- Propor ajustes de meta para a loja
- Ver feedback histórico
- Trocar de cliente/loja em poucos taps
- Validar PDIs dos vendedores das lojas que atende

**Frequência:** 6-8x/dia (campo intensivo)
**Hardware típico:** mid-tier ou premium, **necessidade de offline-first**

---

## 3. Arquitetura Técnica

### 3.1 Stack Recomendada

| Camada | Decisão | Justificativa |
|--------|---------|---------------|
| **Linguagem** | **Kotlin** | Padrão Android moderno, interop Java, suporte oficial Google |
| **UI** | **Jetpack Compose** | Declarativo, alinhado com React mental model do time web, less boilerplate |
| **Arquitetura** | **MVVM + Clean Architecture** | Separação clara, testabilidade, alinhamento com Atomic Design web |
| **DI** | **Hilt** | Padrão Android, integração nativa com Compose |
| **Network** | **Ktor Client** | Coroutines-native, multiplatform-ready (futuro iOS), customizável |
| **Persistência offline** | **Room + Datastore** | Room para queries complexas, Datastore para prefs |
| **State management** | **StateFlow + UI State pattern** | Reativo, type-safe, integração nativa com Compose |
| **Async** | **Kotlin Coroutines + Flow** | Padrão Kotlin, cancelable, structured concurrency |
| **Auth** | **Supabase Auth (kotlin SDK)** | Reuso do backend Supabase do web (JWT compartilhado) |
| **Realtime** | **Supabase Realtime channels** | Mesmo modelo do web |
| **Storage** | **Supabase Storage** | Fotos de visita, anexos PDI |
| **Push notifications** | **FCM (Firebase Cloud Messaging)** | Padrão Android, custom server hooks via Edge Functions |
| **Crash + Analytics** | **Sentry Android + Firebase Analytics** | Sentry já em uso no web (correlation_id consistente) |
| **Maps** | **Google Maps SDK** | Geolocalização das lojas/visitas |
| **Forms** | **Compose nativo + custom validators** | Sem libs externas, controle total |
| **Testes** | **JUnit5 + Mockk + Compose Test + Maestro (E2E)** | Cobertura unit + integration + E2E real device |
| **CI/CD** | **GitHub Actions + Fastlane + Google Play Internal Track** | Pipeline canary com staged rollout |
| **Distribuição** | **Google Play Store** (test track → prod) | Padrão |
| **Build** | **Gradle 8.5+ com Kotlin DSL** | Padrão moderno |

### 3.2 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    APRESENTAÇÃO (Compose)                    │
│   Screens • ViewModels (StateFlow) • Navigation (Compose)    │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    DOMÍNIO (Use Cases)                       │
│   SubmitCheckinUseCase • GetRankingUseCase • SyncOffline...  │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  DADOS (Repositories)                        │
│   CheckinRepository • UserRepository • OfflineQueueRepo...   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐
│ Supabase API │  │ Local (Room/DS)  │  │ FCM / Sentry    │
│ Ktor Client  │  │ Cache + Queue    │  │ Background      │
└──────────────┘  └──────────────────┘  └─────────────────┘
```

### 3.3 Suporte de Versões Android

- **minSdk: 26** (Android 8.0) — cobre 97% dos dispositivos ativos no Brasil
- **targetSdk: 35** (Android 15)
- **compileSdk: 35**

### 3.4 Multi-tenant + Permissões

- **Tenant scope:** todo request carrega o JWT do usuário (já contém tenant info via Supabase RLS)
- **RBAC client-side:** apenas para UX (esconder menus). **Validação real é server-side (RPCs SECURITY DEFINER)**, idêntico ao web pós-Story 1.10
- **Switch de loja (Daniela):** trocar contexto via dropdown no header; backend já suporta via `vinculos_loja`
- **Simulação de perfil (admin MX):** feature flag `enable_role_simulation` para Daniela visualizar app como vendedor/gerente para debug

---

## 4. Módulos por Persona

### 4.1 Vendedor (Ana)

#### M-V01 — Login + Onboarding
- Login com email + senha (Supabase Auth)
- Biometria (Fingerprint / Face Unlock) após primeiro login
- Recuperar senha via email magic link
- Onboarding (3 telas): "Lance suas vendas em 60s", "Veja seu ranking", "Receba feedback do gerente"
- Permissões solicitadas: notificações push, localização (opcional, só para feature de visita presencial)

#### M-V02 — Home / Dashboard Pessoal
- Header: foto, nome, loja atual, role badge
- Card: status do checkin de hoje (vermelho=pendente, amarelo=parcial, verde=concluído)
- Card: ranking semanal (posição + delta)
- Card: meta do mês (% atingido)
- Botão flutuante: **"Lançar checkin"** (CTA principal)
- Lista: últimas notificações
- Bottom nav: Home, Checkin, Ranking, Feedback, Perfil

#### M-V03 — Checkin Diário (CORE)
- Form: leads dia anterior, agendamentos do carrinho, agendamentos da rede, vendas porta, vendas carrinho, vendas rede, visitas dia anterior
- Validação client-side antes do submit (gate 09:45, vínculo ativo)
- Submit → RPC `submit_checkin` (com correlation_id + Sentry tag)
- Feedback visual de sucesso: confetti animation curta + "Você foi #X a lançar hoje"
- Estado de erro: mensagem amigável + trace_id (Story 1.5 pattern)
- Modo offline: persiste em queue Room, sync quando online (max 24h, depois descarta com aviso)

#### M-V04 — Ranking
- Tabs: Loja / Rede MX
- Período: hoje / semana / mês
- Lista ordenada com avatar, nome, KPIs, posição
- Highlight do próprio usuário
- Detail tap: profile do vendedor (modal)
- Performance: paginação 20 itens

#### M-V05 — Feedback Recebido
- Lista de feedbacks recebidos do gerente
- Marcador "novo" para não lidos
- Detail: texto completo + reação (👍 / 🙏 / 💪 / 🤔)
- Reação enviada via RPC → marca lido + registra emoji

#### M-V06 — PDI (Plano de Desenvolvimento Individual)
- Lista de PDIs ativos (objetivo, prazo, status)
- Detail: checklist de tarefas + comentários
- Marcar tarefa como concluída → atualiza progresso
- Anexar evidência (foto ou link) — uploadar para Supabase Storage

#### M-V07 — Treinamentos
- Lista de cursos (vídeo + texto)
- Player nativo (ExoPlayer)
- Marca progresso (% assistido)
- Quizzes ao final (validação aprendizado)

#### M-V08 — Perfil & Configurações
- Editar nome, foto
- Trocar senha (RPC `update_my_profile`)
- Notificações (granular por tipo)
- Tema claro/escuro/sistema
- Privacidade (consent LGPD)
- Logout

---

### 4.2 Gerente (Bruno)

Tudo de Vendedor (M-V01 a M-V08) +

#### M-G01 — Dashboard da Loja
- Header: nome da loja, role badge "Gerente"
- KPIs: faturamento mês, % meta, checkin rate hoje, ranking da loja na rede
- Gráfico: evolução diária do mês (linha)
- Alertas: vendedores sem checkin pós 09:45 (CTA push notification)
- Quick actions: enviar feedback, ver equipe, ajustar metas (se permitido)

#### M-G02 — Gestão de Equipe
- Lista de vendedores ativos
- Métricas por vendedor: % meta, ranking, último checkin
- Detail: profile completo
- Aprovar pré-cadastro (notif push → tap → tela aprovação)
- Encerrar vínculo (com aviso de impacto)

#### M-G03 — Enviar Feedback
- Selecionar vendedor
- Form: tipo de feedback (Reconhecimento, Atenção, Plano), texto, ações sugeridas
- Submit → notif push para vendedor
- Histórico de feedbacks enviados

#### M-G04 — Rotina Matinal (Ritual)
- Wizard guiado pela manhã:
  1. Confirmar presença
  2. Validar checkins da equipe
  3. Visualizar alertas
  4. Definir foco do dia
- Resultado registrado em logs_auditoria

#### M-G05 — Ajustes de Loja (limitado)
- Configurar metas locais (dentro de regras MX)
- Editar info da loja (endereço, horário)
- Solicitar revisão de meta (envia para consultor MX)

---

### 4.3 Dono de Loja (Carlos)

Acesso a múltiplas lojas (todas que possui) +

#### M-D01 — Dashboard Executivo Multi-loja
- Seletor de loja (dropdown header) OU view consolidada "Todas"
- KPIs consolidados: faturamento total, % meta agregada, lojas em risco
- Comparativo entre lojas (gráfico de barras)
- Drill-down: tap em loja → dashboard daquela loja

#### M-D02 — Aprovações
- Lista de aprovações pendentes:
  - Criação de novas lojas (consultor MX propõe → dono aprova)
  - Mudança de meta mensal (>10% delta)
  - Contratação de novos gerentes
- Detail: contexto + tap aprovar/rejeitar

#### M-D03 — Relatórios Mensais
- Recebe push notification dia 1 de cada mês
- Lista de relatórios PDF (matinal, semanal, mensal)
- Tap → preview + share

#### M-D04 — Alertas de Exceção
- Push notification quando loja entra em zona de risco:
  - Loja < 70% da meta no dia 25 do mês
  - Vendedor com 0 vendas em 3 dias consecutivos
  - Queda > 30% em métrica chave (configurable)

---

### 4.4 Admin MX / Consultor (Daniela)

#### M-A01 — Agenda de Visitas
- Calendário (mês/semana/dia)
- Cards de visitas: cliente, loja, horário, status
- CRUD de visita
- Sync com Google Calendar (já existe no backend)
- Notificação 30min antes

#### M-A02 — Execução de Visita (CORE — offline-first)
- Form longo dividido em wizard de 5-8 etapas:
  1. Check-in geolocalizado (validar dentro do raio da loja)
  2. Diagnóstico inicial (perguntas)
  3. Foto-evidências (Camera API, upload Storage)
  4. Métricas observadas
  5. Reuniões realizadas
  6. Próximos passos / metas propostas
  7. Assinatura do gerente (canvas)
  8. Submit
- **Offline-first**: tudo persiste local; ao voltar online, sync automático
- Relatório PDF gerado server-side via Edge Function

#### M-A03 — Painel Consultor
- Lista de todas lojas dos clientes que atende
- Filtros: status (saudável / atenção / crítico)
- Drill-down: detail completo da loja
- Métricas comparativas com a rede MX

#### M-A04 — Detalhe Cliente (paridade com web)
- Tabs:
  - Visão geral (KPIs, histórico)
  - Visitas (lista + detail)
  - ROI (cálculo investimento vs retorno)
  - PDIs (visão consolidada)
- Modais: edit cliente, criar visita

#### M-A05 — Gestão de Metas
- Lista de propostas pendentes
- Editor de meta: meta atual, proposta, justificativa
- Submit → vai para aprovação do dono

#### M-A06 — Comunicação
- Chat com lojistas (futuro — backlog Sprint 5)
- Por enquanto: feedback assíncrono via RPC

#### M-A07 — Relatórios para Gerar
- Relatório matinal (cada loja, automático às 8h)
- Relatório semanal (toda sexta)
- Relatório mensal (dia 1)
- Botão "Gerar agora" para sob demanda

---

## 5. Features Comuns (Cross-persona)

### 5.1 Autenticação
- Email + senha (Supabase Auth)
- Biometria (após primeiro login)
- Recuperação por email (magic link)
- Sessão persistente (refresh token automático)
- Logout limpa cache local

### 5.2 Notificações Push (FCM)
**Tópicos:**
- `checkin_lembrete` (vendedor, 8h45 — 1h antes do gate)
- `feedback_recebido` (vendedor)
- `equipe_sem_checkin` (gerente, 09:46)
- `aprovacao_pendente` (dono)
- `visita_proxima` (consultor, 30min antes)
- `meta_em_risco` (dono, configurable)
- `pdi_atualizado` (vendedor + gerente)

**Configurações:**
- On/off por tópico
- Horário de silêncio (não receber 22h-7h)
- Som personalizado por tópico

### 5.3 Modo Offline
- **Indicador visual:** banner "Sem conexão — modo offline"
- **Capacidades offline:**
  - Visualizar dados cached (últimas 24h)
  - Submeter checkin (queue)
  - Iniciar/continuar visita (consultor)
  - Marcar PDI como concluído (queue)
  - Enviar feedback (queue)
- **Sync:** quando online detectado, sync queue na ordem original
- **Conflitos:** server wins (com aviso ao usuário)
- **Estratégia:** Room database + WorkManager para sync background

### 5.4 Tema Claro/Escuro
- Sistema (default) — segue setting do device
- Forçar claro
- Forçar escuro
- Cores brand (`--color-primary: #0D3B2E` etc., paridade com web)

### 5.5 Internacionalização
- Português (BR) — único idioma v1
- Estrutura preparada para adicionar EN/ES no futuro (`strings.xml` recurso padrão)

### 5.6 Acessibilidade
- **WCAG 2.1 AA** baseline (mesmo padrão da web pós-Story 3.11)
- TalkBack (screen reader Android) suportado em todas telas
- Tamanho mínimo touch target 48dp
- Contraste mínimo 4.5:1 (texto normal), 3:1 (texto grande)
- Suporte a Dynamic Type (escala de fonte)
- Focus visível em navegação por teclado externo

### 5.7 Privacidade & LGPD
- Tela de consent no primeiro login
- Configurações de privacidade granulares
- Exportar meus dados (em JSON, via RPC do backend)
- Direito ao esquecimento (delete account com confirmação dupla)
- Logs de acesso visíveis ao usuário (últimos 30 dias)

### 5.8 Performance
- **Cold start <2s** em Moto G low-end
- **Smooth 60fps** em rolagem de listas longas
- **Bundle inicial <30MB** (APK base)
- **Bundle por feature <10MB** (Dynamic Feature Modules para módulos pesados como Treinamentos)
- **Memory <150MB** em sessão típica
- **Battery drain <3%/hora** em uso ativo
- **Network usage <50MB/dia** para vendedor (cache agressivo, imagens otimizadas)

### 5.9 Observabilidade
- **Sentry Android:** capturas de crash + breadcrumbs + correlation_id (compartilhado com web)
- **Firebase Analytics:** eventos de funil (login, checkin completed, ranking viewed, feedback sent)
- **Custom metrics:** time-to-checkin, time-to-first-action, offline-queue-size
- **Web Vitals equivalent:** TTI (time to interactive), Time to first frame

---

## 6. Integrações

| Sistema | Propósito | Fluxo |
|---------|-----------|-------|
| **Supabase Auth** | Login/sessão | Direto via SDK Kotlin |
| **Supabase PostgREST** | CRUD via RPCs (mesmas do web) | Reuso 100% — sem duplicação |
| **Supabase Realtime** | Push de notif checkin team | Channel subscribe |
| **Supabase Storage** | Upload fotos visita, avatares, PDI evidence | SDK direto |
| **Supabase Edge Functions** | Relatórios PDF, sync Google Calendar, FCM dispatch | Trigger via RPC |
| **FCM** | Push notifications | Edge Function backend chama FCM API |
| **Sentry** | Crash + correlation_id | SDK Android |
| **Firebase Analytics** | Funil de produto | SDK |
| **Google Maps SDK** | Loja location + visita check-in | SDK |
| **ExoPlayer** | Vídeos de treinamento | SDK Google |
| **Camera API (CameraX)** | Fotos visita / evidência PDI | Padrão Android |
| **Biometric API** | Auth biometria | Padrão Android |

**REUSO BACKEND:** O app Android usa **100% do backend Supabase existente** — zero novos endpoints. Todas as 5 RPCs novas (Story 1.1) + `submit_checkin`, `checkin_validation_kit`, etc. funcionam idênticas ao web.

---

## 7. Requisitos Não-Funcionais (NFRs)

### 7.1 Performance
- Cold start <2s (P90) em Moto G (4GB RAM)
- Tempo de submit checkin <800ms (P95) com 4G
- Rolagem 60fps em listas até 1000 itens
- App size APK base <30MB

### 7.2 Disponibilidade
- App funciona offline com degradação graceful (avisos claros)
- Reconexão automática
- Cache local válido por 24h

### 7.3 Segurança
- TLS 1.3 obrigatório (não permitir TLS<1.2)
- Certificate pinning para Supabase API
- Biometria opcional mas recomendada
- Tokens JWT armazenados em **EncryptedSharedPreferences** (não em SharedPrefs comum)
- Storage criptografado para queue offline (Android Keystore)
- Anti-tampering: detecção de root + abort se em prod (configurable por feature flag)
- ProGuard/R8 ativo em release builds

### 7.4 Compatibilidade
- minSdk 26 (Android 8.0+)
- targetSdk 35
- Tablets: layout phone (não há otimização tablet v1)
- Dispositivos com >2GB RAM (low-end Moto G aceitável)

### 7.5 Manutenibilidade
- Cobertura de testes >70% (unit + integration)
- E2E (Maestro) cobrindo top 5 user journeys
- Documentação interna em código (KDoc obrigatório em public APIs)
- ADRs para decisões arquiteturais
- CodeRabbit ou equivalente em PRs

### 7.6 Compliance LGPD
- Consent explícito no primeiro login
- Right-to-erasure funcional (acionar via app)
- Audit log de acessos do próprio usuário
- Encriptação de dados sensíveis em repouso (queue offline)
- Não coletar PII desnecessário (Firebase Analytics anonimo via `setAnalyticsCollectionEnabled` com consent)

---

## 8. UX & Design System

### 8.1 Princípios
1. **Mobile-first sempre** (não miniatura da web)
2. **Fluxos críticos em <3 taps** (login → checkin)
3. **Empty states informativos** (não "Sem dados")
4. **Feedback imediato** (loading skeleton em <200ms, success após action)
5. **Offline graceful** (claro o que está sincronizando)
6. **Acessibilidade não-opcional** (WCAG 2.1 AA gate em design review)

### 8.2 Design Tokens (paridade com web)
Cores brand:
- Primary: `#0D3B2E` (verde MX)
- Success: `#22C55E`
- Warning: `#FACC15`
- Danger: `#EF4444`
- Info: `#3B82F6`

Tipografia: Inter (substitui Roboto default)
Spacing: 4dp base scale (4, 8, 12, 16, 24, 32, 48, 64)
Bordas: 8dp/12dp/16dp/full (avatar)
Sombras: elevation 1-4 (Material 3)
Animações: <200ms curtas (motion-safe respect)

### 8.3 Material Design 3
- Base Material 3 (Material You)
- Adaptação para brand colors
- Dynamic Color suportado (Android 12+) — opt-in
- Bottom navigation para personas com 4-5 áreas
- Top app bar contextual

### 8.4 Componentes-chave
- KPICard
- RankingRow (avatar + nome + número + delta)
- CheckinFormCard
- VisitaTimeline
- StatusBadge (verde/amarelo/vermelho)
- PullToRefresh
- SkeletonShimmer (paridade com web Story 3.14)
- Bottom Sheet para detail/modals (mais mobile-friendly que Dialog)

---

## 9. Roadmap & Fases

### Fase 1 — MVP Vendedor (8 semanas, ~640h dev)
**Goal:** vendedor faz checkin pelo app, vê ranking, recebe feedback.

Sprint 1.A (2 sem): Auth + Home + Checkin
Sprint 1.B (2 sem): Ranking + Notificações + Perfil
Sprint 1.C (2 sem): Feedback + PDI + Treinamentos básicos
Sprint 1.D (2 sem): Polimento + QA + beta interno

**Critério de saída:** 50 vendedores em beta fechado, 95% checkin rate, 0 crashes críticos.

### Fase 2 — Gerente (4 semanas, ~320h dev)
**Goal:** gerente opera loja remotamente.

Sprint 2.A (2 sem): Dashboard loja + Gestão equipe
Sprint 2.B (2 sem): Feedback + Rotina + Ajustes

**Critério de saída:** 10 gerentes em beta, todos casos de uso cobertos.

### Fase 3 — Dono + Admin MX (6 semanas, ~480h dev)
**Goal:** todas as personas operam pelo app.

Sprint 3.A (3 sem): Dashboard executivo dono + Aprovações + Alertas
Sprint 3.B (3 sem): Agenda + Execução visita (offline-first) + Painel consultor

**Critério de saída:** 100% das personas ativas no app.

### Fase 4 — Polimento & Launch (4 semanas, ~320h dev)
**Goal:** launch público.

Sprint 4.A (2 sem): Modo offline completo + LGPD + accessibility audit
Sprint 4.B (2 sem): Performance optimization + Sentry tuning + Play Store assets

**Critério de saída:**
- Play Store rating 4.5+
- Cold start <2s em Moto G
- Sentry crash rate <0.5%
- Lighthouse-equivalent score (Android Vitals) >90

### Total
**~1.760 horas (~22 semanas / ~5.5 meses) com time de 3 mobile devs + 1 designer + 1 QA + 1 PM**

---

## 10. Stack de Desenvolvimento

### 10.1 Pré-requisitos do time
- 3 Android devs (Kotlin + Compose)
- 1 UX designer (Material Design 3 + Figma)
- 1 QA mobile (Maestro + manual testing em devices reais)
- 1 PM
- 1 backend dev part-time (qualquer ajuste server-side em RPCs)

### 10.2 Ambiente
- Android Studio Hedgehog+
- Gradle 8.5+
- Kotlin 2.0+
- JDK 17

### 10.3 CI/CD
- **GitHub Actions:**
  - PR: lint + unit tests + UI tests + bundle size check
  - Merge main: build internal track APK + upload Play Console + Sentry release
  - Tag release: promove para production track (manual approve)
- **Fastlane:** automação de release notes + screenshots store
- **Play Console:** staged rollout (5% → 25% → 100% em 7 dias)

### 10.4 Beta Testing
- Internal Track (time interno + 5 redes piloto)
- Closed Track (50 lojas selecionadas, 2 semanas antes de prod)
- Open Track (opcional, beta público)

---

## 11. Métricas de Lançamento (Critérios de Done v1)

### Técnicas
- ✅ Crashes-free rate >99.5%
- ✅ ANRs (Application Not Responding) <0.05%
- ✅ Cold start P90 <2s em Moto G
- ✅ Tamanho APK base <30MB
- ✅ Cobertura testes unit >70%
- ✅ E2E suite verde (5 fluxos críticos)
- ✅ Acessibilidade WCAG 2.1 AA validada
- ✅ Sentry com source maps + correlation_id ativo
- ✅ Branch protection + status checks ativos

### Produto
- ✅ Todas personas testadas em beta fechado por 4+ semanas
- ✅ DAU/MAU vendedor >0.6
- ✅ Tempo médio para checkin <60s
- ✅ Taxa de adoção 90 dias >70% da base ativa web
- ✅ Play Store rating >4.5 (mínimo 100 reviews)

### Negócio
- ✅ Aprovação stakeholders MX
- ✅ Treinamento equipe support
- ✅ Documentação onboarding usuário pronta
- ✅ Plano de migração da base web (incentivo + comunicação)

---

## 12. Riscos & Mitigações

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|:---:|:---:|-----------|
| R1 | Backend Supabase RLS bloquear casos edge no mobile (que web não tinha) | Média | Alto | Smoke 403 expandido pra mobile contexts; Story 0.5 RLS matrix verde |
| R2 | Performance ruim em Moto G low-end | Alta | Alto | Teste contínuo no Moto G real; budget bundle estrito; Compose perf monitoring |
| R3 | Offline sync conflitos complicarem UX | Média | Alto | Server-wins policy clara; aviso ao usuário; logs detalhados |
| R4 | Adoção lenta vs web (usuários hábito) | Média | Médio | Migração assistida + bônus 30 dias + push notifications convidando |
| R5 | LGPD compliance fail em audit | Baixa | Crítico | Tela consent + DPO review antes de launch + right-to-erasure testado |
| R6 | FCM rate limit ou caro em escala | Baixa | Médio | Throttle + agregação (digest notif vs spam) |
| R7 | Crash em fluxo crítico (checkin) gerar perda de bonus do vendedor | Média | Alto | Auto-save em queue offline; retry logic; Sentry com pri P0 alert |
| R8 | App Store rejection na primeira submissão | Média | Médio | Pre-launch checklist Google Play; review interno antes |
| R9 | Sentry cost spike em produção | Baixa | Médio | Sample rate ajustável; quotas por dia; alertas no dashboard |
| R10 | Time mobile sem experiência em offline-first | Alta | Alto | Workshop inicial; spike técnico em Sprint 0; mentor externo se necessário |

---

## 13. Decisões Pendentes (a discutir com stakeholders)

1. **Política de bonificação no app vs web** — vendedor ganha bônus extra por usar mobile? (incentivo de adoção)
2. **Suporte iOS** — incluir como Sprint 5 ou esperar 1 ano de Android primeiro?
3. **Marketplace de treinamentos pagos** — escopo futuro vs já v2?
4. **Whatsapp Business integration** — substitui feedback in-app? Complementa?
5. **White-label** — alguma rede grande quer rebranding completo?
6. **Frequência de release** — semanal (agressivo) vs bi-semanal (conservador)?
7. **Telemetria opt-out** — granular por evento ou tudo ou nada?

---

## 14. Anexos

### A. Glossário
- **Checkin:** lançamento diário de métricas pelo vendedor (leads, agendamentos, vendas, visitas)
- **Gate 09:45:** prazo até quando vendedor pode lançar checkin do dia anterior
- **PDI:** Plano de Desenvolvimento Individual
- **PMR:** mecanismo proprietário MX de previsão de meta
- **Rede MX:** conjunto de lojas que usam a consultoria MX
- **Cliente MX (no contexto admin):** uma rede de lojas que contrata MX

### B. Referências
- `docs/prd/technical-debt-assessment.md` — débito técnico web (resolvido em hardening)
- `docs/architecture/system-architecture-brownfield-2026-05-16.md` — arquitetura web atual
- `docs/frontend/frontend-spec.md` — spec frontend web
- `docs/adr/0050-pages-decomposition-pattern.md` — padrão de decomposição (replicar em mobile)
- `docs/dev/observability.md` — Sentry + correlation_id (compartilhado mobile/web)
- `supabase/migrations/` — schema do backend (reuso 100%)

### C. Próximos Passos
1. **Aprovação board** deste PRD (1 semana)
2. **RFP** para contratar 3 mobile devs (4-6 semanas)
3. **Workshop kickoff** com time alocado (1 semana)
4. **Sprint 0 mobile** (setup repo, CI, environment, design system) — 2 semanas
5. **Sprint 1.A** (MVP vendedor — Auth + Home + Checkin) — 2 semanas

---

**Aprovações requeridas:**
- [ ] CEO MX
- [ ] CTO
- [ ] DPO (LGPD)
- [ ] Head de Produto
- [ ] Head de Design
- [ ] Tech Lead Web (sign-off em reuso backend)

**Versão:** 1.0 — 2026-05-21
**Próxima revisão:** 30 dias pós-aprovação ou ao final do Sprint 1.A
