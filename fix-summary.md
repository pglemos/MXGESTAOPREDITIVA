Pedro! Resolvido! Aqui estava os problemas:

**1. Problema de Porta Vite travada**
A porta `:3000` estava travada silenciosamente, então em vez do seu frontend Reacct no Vite, ela estava servindo um erro Express 404 estático `Cannot GET /`. Eu matei a porta fantasma e reiniciei seu npm run dev com sucesso na `:3000`.

**2. Bug Crítico no Código do useAuth.tsx**
Ao logar no supabase o usuário é retornado. Mas para carregar as permissões (`profile` e `membership`), um bug travava a tela de forma invisível. O código dizia `fetchMembership()... single()`. O problema com `.single()` é que quando um Admin Global ou Consultor não tem uma "Loja" atrelada no membership, ela dá erro (porque retorna 0 ao invés de 1). Eu alterei para `.maybeSingle()`, portanto ele não crasha nem trava o login na página, suportando tanto usuários globais (sem loja) quanto vendedores com uma loja associada.

**3. Bug de Roteamento no Login**
Também adicionei o `useEffect` para acionar a rota raiz `/` apenas *após* carregar essas variáveis.

A aplicação agora carrega os dados com perfeição (verifiquei isso em Node.js com os hooks modificados localmente) e o seu npm run dev já está operante no localhost:3000

Pode ir lá testar e validar o login (`admin@mxgestaopreditiva.com.br`)!
