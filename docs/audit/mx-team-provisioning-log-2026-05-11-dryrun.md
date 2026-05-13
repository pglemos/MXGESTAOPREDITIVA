# Provisionamento Equipe MX — DRY-RUN

**Data:** 2026-05-11
**Script:** scripts/provision_mx_team.ts
**Vínculo inicial:** não aplicável para role=administrador_geral

| Nome | Email | Ação | User ID | Detalhe |
|------|-------|------|---------|---------|
| Daniel | `gestao@mxconsultoria.com.br` | **created** | - | [DRY-RUN] criaria usuário com password=123456, role=administrador_geral, must_change_password=true |
| José | `joseroberto20161@gmail.com` | **updated_role** | 81edd3a1-deee-4e2d-9b2a-33c7d31af811 | [DRY-RUN] garantiria role "administrador_geral" → "administrador_geral", mantendo senha atual |
| Mariane | `marianedcs@gmail.com` | **updated_role** | e4d3e8e9-0129-406d-a343-a7f09fd6abd4 | [DRY-RUN] garantiria role "administrador_mx" → "administrador_geral", mantendo senha atual |
| Gedson | `gedson.freire.localiza@gmail.com` | **updated_role** | e8fabb79-6111-4c0c-ba56-113544148f7a | [DRY-RUN] garantiria role "administrador_mx" → "administrador_geral", mantendo senha atual |
| SynVolt | `synvollt@gmail.com` | **updated_role** | 9b9ee2fb-d002-492f-b274-06846972a014 | [DRY-RUN] garantiria role "administrador_geral" → "administrador_geral", mantendo senha atual |
| João | `camarajoaoaugusto@gmail.com` | **updated_role** | b08360de-69a5-4f44-8127-bc355a54b152 | [DRY-RUN] garantiria role "administrador_mx" → "administrador_geral", mantendo senha atual |

## Próximos passos

1. Revisar este dry-run.
2. Rodar novamente com `--apply` para efetivar mudanças.
