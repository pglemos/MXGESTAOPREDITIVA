# Story OPS-20260514 - Reset Admin Master e Recuperação de Senha

## Status

Ready for Review

## Contexto

A Admin Master MX Mariane esqueceu a senha. O acesso precisa ser restaurado com senha provisória `123456`, troca obrigatória no primeiro login e um fluxo público de "Esqueci minha senha" na tela de login.

## Acceptance Criteria

- [x] Garantir `marianedcs@gmail.com` como `administrador_geral`, ativa e confirmada.
- [x] Resetar senha provisória para `123456` e marcar `must_change_password=true`.
- [x] Adicionar botão "Esqueci minha senha" na tela `/login` preservando o design atual.
- [x] Enviar recovery pelo Supabase Auth com redirect para `/login?recovery=1`.
- [x] Permitir definir nova senha via link de recovery e limpar `must_change_password`.
- [x] Validar fluxo completo com usuário E2E controlado.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.

## Dev Agent Record

### Debug Log

- Story criada a partir de requisito operacional direto do usuário.
- Conta `marianedcs@gmail.com` validada no live: Auth existe, e-mail confirmado, role `administrador_geral`, active `true`.
- Senha provisória resetada para `123456` com `must_change_password=true`.
- Implementado fluxo público de recuperação em `/login`: login, solicitação de reset e definição de nova senha por sessão de recovery.
- E2E local `auth-password-recovery.playwright.ts` passou no Chromium.
- Gates locais passaram: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Deploy de produção criado e alias atualizado para `https://mxperformance.vercel.app`.
- E2E live passou contra `https://mxperformance.vercel.app`.
- Login live da Mariane com senha provisória abriu o modal `Segurança MX`; a sessão foi encerrada sem trocar a senha pessoal.

### Completion Notes

- Conta da Mariane pronta para primeiro acesso com senha provisória e troca obrigatória.
- Recovery de senha validado com usuário E2E controlado; não foi afirmada entrega no inbox pessoal da Mariane.

### File List

- `docs/stories/story-OPS-20260514-admin-master-password-recovery.md`
- `src/pages/Login.tsx`
- `src/test/auth-password-recovery.playwright.ts`
- `src/test/e2e-helpers/supabase-admin.ts`
