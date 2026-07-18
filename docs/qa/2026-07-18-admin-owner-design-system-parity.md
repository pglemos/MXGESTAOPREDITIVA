# Verificação de Paridade do Design System

Data: 18 de julho de 2026

## Escopo

Unificação visual e estrutural dos perfis:

- `administrador_geral`;
- `administrador_mx`;
- `consultor_mx`;
- `dono`;
- `gerente`, como referência canônica e também consumidor da mesma origem compartilhada.

## Causa raiz

O sidebar já havia sido unificado, porém os perfis internos continuavam envolvidos por `InternalMxPageFrame` e por folhas CSS globais que alteravam componentes e rotas com seletores amplos e `!important`. Assim, o conteúdo não compartilhava realmente a mesma fundação do módulo Gerente; recebia apenas uma camada de normalização visual.

## Correção arquitetural

- `MxSidebarShell` permanece como único shell lateral para todos os perfis;
- `Layout.tsx` renderiza o conteúdo das rotas diretamente no mesmo shell, sem frame contextual exclusivo;
- a fundação visual compartilhada foi consolidada em `src/components/module/MxModuleVisualPrimitives.tsx`;
- `ManagerVisualPrimitives.tsx` tornou-se uma fachada de compatibilidade que reexporta os componentes da fundação universal;
- as páginas existentes continuam usando os átomos, moléculas e organismos canônicos do produto, sem wrappers artificiais;
- navegação, capabilities, `canAccessPath`, simulação, badges, notificações, resolução de loja, queries e regras de negócio foram preservados.

## Componentes e estilos legados removidos

- `src/design-system/internal-mx/InternalMxPageFrame.tsx`;
- `src/design-system/internal-mx/InternalMxPageFrame.test.tsx`;
- `src/design-system/internal-mx/internal-mx-frame.css`;
- `src/design-system/internal-mx/internal-mx-components.css`;
- `src/design-system/internal-mx/internal-mx-routes.css`;
- `src/test/internal-mx-complete-visual-migration.test.ts`.

O runtime também deixou de importar `packages/mx-tokens/src/theme.css`, cuja função era sustentar a camada `mxds` antiga. O arquivo do pacote não foi apagado porque continua fazendo parte do pacote versionado, mas não participa mais da aplicação.

## Contratos automatizados

O workflow `Module Design System Parity` impede:

- mais de um `MxSidebarShell` no layout;
- retorno de `InternalMxPageFrame`;
- retorno de `.mx-internal-workspace`;
- imports das folhas `internal-mx-*`;
- marcadores `mxds-*` no código executável;
- separação futura entre as primitivas do Gerente e a fundação visual universal.

## Verificações executadas

- TypeScript com `tsc --noEmit`;
- suíte unitária Bun;
- Module Design System Parity;
- MX Atomic Design Enforcement;
- ESLint de acessibilidade;
- bundle budget;
- Gitleaks;
- CodeRabbit.

Todos os gates concluíram com sucesso no commit funcional anterior a este documento. O commit final deverá repetir integralmente os mesmos gates antes do merge.

## Supabase

Foram realizadas verificações somente leitura das contas de teste e do projeto.

- as contas de Dono, Gerente e Administrador estão ativas;
- os valores legados de `usuarios.role` são normalizados pelo frontend para os perfis esperados;
- nenhuma migration, tabela, view, RPC, trigger, política RLS, Edge Function ou registro de permissão foi alterado;
- nenhum arquivo de `supabase/` faz parte do PR.

## Segurança das credenciais

As credenciais fornecidas para validação não foram adicionadas ao repositório, aos workflows, aos commits, aos comentários do PR ou aos logs públicos. Testes autenticados devem receber credenciais exclusivamente por secrets ou variáveis de ambiente.

## Limitação de evidência visual autenticada

O ambiente desta execução não disponibiliza navegador autenticado conectado ao Preview, e as credenciais não podem ser colocadas em um workflow público. Portanto, não foram produzidos screenshots autenticados dos quatro perfis. A validação disponível cobre estrutura, contratos de runtime, tipos, testes, acessibilidade, bundle, build/deployment, resposta HTTP e saúde dos serviços.

## Critério de merge

O PR só poderá ser mesclado após:

1. todos os workflows do commit final concluírem com sucesso;
2. o Preview Vercel do mesmo SHA atingir `READY`;
3. o Preview responder HTTP 200;
4. não existirem clusters de erro de runtime;
5. não existirem threads de revisão abertas;
6. o projeto Supabase permanecer `ACTIVE_HEALTHY`.
