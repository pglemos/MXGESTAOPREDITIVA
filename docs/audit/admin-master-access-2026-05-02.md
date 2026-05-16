# Auditoria de Acesso Admin Master MX

**Data:** 2026-05-02 21:30 -03  
**Executor:** aiox-master  
**Escopo:** provisionamento/atualizacao live de usuarios Admin Master MX.

## Resultado

| Email | Acao | Role final | Ativo | Troca obrigatoria | Senha provisoria |
|---|---|---|---|---|---|
| `[EMAIL_REDACTED]` | Atualizado | `administrador_geral` | Sim | Sim | Mantida |
| `[EMAIL_REDACTED]` | Criado | `administrador_geral` | Sim | Sim | Definida conforme solicitacao |
| `[EMAIL_REDACTED]` | Atualizado | `administrador_geral` | Sim | Sim | Definida conforme solicitacao |

## Validacao

- Perfis publicos em `usuarios` validados com `role = administrador_geral`, `active = true` e `must_change_password = true`.
- Login temporario validado para as tres contas.
- UI live validada em `https://mxperformance.vercel.app`: as tres contas redirecionam para `/painel` e exibem o modal bloqueante de troca obrigatoria de senha.

## Evidencias

- `output/e2e-admin-master-first-login-danieljsvendas-gmail-com.png`
- `output/e2e-admin-master-first-login-synvollt-gmail-com.png`
- `output/e2e-admin-master-first-login-joseroberto20161-gmail-com.png`
