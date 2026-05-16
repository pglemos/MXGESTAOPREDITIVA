# Provisionamento Equipe MX — APPLY

**Data:** 2026-05-11
**Script:** scripts/provision_mx_team.ts
**Vínculo inicial:** não aplicável para role=administrador_geral

| Nome | Email | Ação | User ID | Detalhe |
|------|-------|------|---------|---------|
| Daniel | `gestao@mxconsultoria.com.br` | **created** | 36dd773b-c841-43a5-bcc3-df0ef9fdc2f9 | criado com senha temporária [SENHA_TEMPORARIA_REDACTED], must_change_password=true, sem membership inicial |
| José | `[EMAIL_REDACTED]` | **updated_role** | 81edd3a1-deee-4e2d-9b2a-33c7d31af811 | administrador_geral garantido; senha atual preservada |
| Mariane | `[EMAIL_REDACTED]` | **updated_role** | e4d3e8e9-0129-406d-a343-a7f09fd6abd4 | administrador_geral garantido; senha atual preservada |
| Gedson | `[EMAIL_REDACTED]` | **updated_role** | e8fabb79-6111-4c0c-ba56-113544148f7a | administrador_geral garantido; senha atual preservada |
| SynVolt | `[EMAIL_REDACTED]` | **updated_role** | 9b9ee2fb-d002-492f-b274-06846972a014 | administrador_geral garantido; senha atual preservada |
| João | `[EMAIL_REDACTED]` | **updated_role** | b08360de-69a5-4f44-8127-bc355a54b152 | administrador_geral garantido; senha atual preservada |

## Próximos passos

1. Compartilhar credenciais com cada colaborador (ver `docs/templates/welcome-message-mx-admin.md`).
2. Rodar `tsx scripts/audit_mx_team_access.ts` novamente para validar estado final.
