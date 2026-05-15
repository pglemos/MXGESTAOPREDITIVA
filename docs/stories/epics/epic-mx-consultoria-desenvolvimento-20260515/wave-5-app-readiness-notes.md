# Onda 5 - Notas de Personalizacao e App Readiness

**Data:** 2026-05-15  
**Origem:** reuniao Jose Roberto + Daniel Santos MX  
**Orquestracao:** @aiox-master  
**Status:** Draft para PM/PO/DevOps

## Base Existente

- Projeto web usa Vite e `vite-plugin-pwa`.
- Ha foco mobile em `Layout.tsx`, `Checkin.tsx`, `VendedorHome.tsx` e rotinas do vendedor.
- Conteudos e treinamentos ja existem como frente funcional.
- Multi-tenant por loja precisa ser preservado em qualquer conteudo personalizado.

## Corte MVP

1. Preparar conteudo institucional por loja como extensao da trilha de novo colaborador.
2. Criar curadoria simples para conteudos de especialistas e fornecedores.
3. Criar checklist de readiness mobile/PWA.
4. Criar checklist de submissao Apple/Google antes de qualquer envio real.

## Fora do MVP

- Submissao real para Apple/Google.
- Build nativo definitivo sem decisao tecnica.
- Gravacao/edicao de videos dentro do sistema.
- Marketplace ou monetizacao de conteudos.
- Conteudo institucional obrigatorio para todas as lojas.

## Riscos

- Vazamento de conteudo institucional entre lojas.
- App submetido antes de fluxos vendedor/gerente/dono estarem estaveis.
- Promessa comercial de app nativo quando PWA pode ser a entrega inicial.
- Conteudo de terceiro sem aprovacao editorial.

## Recomendacao do Orquestrador

Executar `APP-30` antes de qualquer submissao. `APP-28` e `APP-29` podem evoluir em paralelo com produto, mas dependem das bases de biblioteca/trilha da Onda 4. `APP-31` deve ser tratado como gate operacional de @devops e @qa.
