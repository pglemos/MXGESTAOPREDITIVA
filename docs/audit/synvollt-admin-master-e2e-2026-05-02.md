# Validação E2E Admin Master MX — synvollt

**Data:** 2026-05-02 21:35 -03  
**Usuário:** `synvollt@gmail.com`  
**Role validada:** `administrador_geral`  
**Ambiente:** `https://mxperformance.vercel.app`

## Resultado

Validação aprovada. O usuário consegue sair do estado inicial com senha provisória, trocar a senha no primeiro acesso, acessar o painel Admin Master e executar operações estruturais do sistema com sessão real.

Ao final da validação, a conta foi restaurada para o estado esperado de primeiro acesso real: senha provisória solicitada e `must_change_password = true`.

## Cobertura Validada

- Perfil live em `usuarios`: `role = administrador_geral`, `active = true`, `must_change_password = true`.
- Primeiro login com senha provisória aceito.
- Modal bloqueante de troca obrigatória exibido.
- Troca de senha aceita com política forte.
- Pós-login liberado para `/painel`.
- Perfil pós-troca validado com `must_change_password = false`.
- Matriz de permissões de Admin Master validada com 24 permissões.
- Permissões estruturais de exclusão validadas para `lancamentos_diarios`, `metas`, `consultoria` e `financeiro`.
- Criação de loja temporária via sessão real do usuário.
- Criação dos defaults operacionais da loja: entrega, metas e benchmarks.
- Criação de usuário temporário via Edge Function `register-user` com membership de loja.
- Atualização de loja via sessão real do usuário.
- Limpeza dos artefatos E2E temporários.
- Restauração final da conta para primeiro acesso real.

## UI Live Validada

- `/painel`
- `/lojas`
- `/consultoria/clientes`
- `/agenda`
- `/produtos`
- `/configuracoes?aba=lojas-rede`
- `/configuracoes?aba=equipe-usuarios`

## Evidências

- `output/e2e-synvollt-01-force-password-20260503003449.png`
- `output/e2e-synvollt-02-dashboard-20260503003449.png`
- `output/e2e-synvollt-03-config-lojas-20260503003449.png`
- `output/e2e-synvollt-04-config-usuarios-20260503003449.png`
- `output/e2e-synvollt-05-ui-routes-20260503003554.png`
