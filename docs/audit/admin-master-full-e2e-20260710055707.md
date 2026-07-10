# Validacao E2E Admin Master MX - 20260710055707

- Run ID: `E2E_ADMIN_MASTER_20260710055707`
- Usuario validado: `synvollt@gmail.com`
- Ambiente: `https://mxperformance-9xqlwubmr-synvolt.vercel.app`
- Status geral: `FAIL`
- Senha: nao registrada neste artefato.

## Resumo

| Status | Total |
| --- | ---: |
| PASS | 52 |
| WARN | 3 |
| FAIL | 1 |
| BLOCKED | 0 |

## Resultados

| Secao | Validacao | Status | Detalhes |
| --- | --- | --- | --- |
| Preflight | account, role and password login | PASS | `{"duration_ms":472,"profile":{"id":"9b9ee2fb-d002-492f-b274-06846972a014","email":"synvollt@gmail.com","name":"SynVolt","role":"administrador_geral","active":true,"must_change_password":false}}` |
| Preflight | permission matrix | PASS | `{"duration_ms":125,"modules":7,"permission_codes":["comparar","criar","editar","excluir","exportar","visualizar"],"matrix_rows":24,"delete_permissions":5,"export_permissions":1}` |
| CLI/API | store CRUD and operational rules | PASS | `{"duration_ms":631,"store_id":"4f77858c-bc22-4da8-a817-fb177b469813","store_name":"E2E ADMIN MASTER 20260710055707 EDITADA","manager_email":"synvollt@gmail.com"}` |
| CLI/API | feedback upsert constraint | FAIL | `{"message":"there is no unique or exclusion constraint matching the ON CONFLICT specification"}` |
| CLI/API | team/user CRUD, seller tenure and checkins | PASS | `{"duration_ms":2621,"user_id":"33a59ee3-29b5-4681-be8e-d4a92b5cfcb0","feedback_id":"63a1c01e-57fe-4b5c-85ff-e69da1bc4f30","checkin_rows":4}` |
| CLI/API | digital product CRUD | PASS | `{"duration_ms":147,"product_id":"36804fe8-fbe1-4cc3-a09b-8fc5ef1df497","status":"ativo"}` |
| CLI/API | consulting client, visit and agenda CRUD | PASS | `{"duration_ms":482,"client_id":"4b998f2a-ce28-42ee-973c-ce25bb465715","visit_id":"e8502917-25b1-4edd-a584-552abc2d46e0","event_id":"65b15c56-d9c9-46b4-86d2-af5026986e6c","slug":"e2e-admin-master-20260710055707"}` |
| CLI/API | evidence upload and visit completion | PASS | `{"duration_ms":686,"negative_without_evidence_ok":true,"evidence_id":"b932f017-41c8-4c30-a757-a2874e221f1d","completed_status":"concluida"}` |
| Integracoes externas | relatorio-matinal | WARN | `{"name":"relatorio-matinal","status":"WARN","email":"not_sent","recipients":1,"dry_run":false}` |
| Integracoes externas | feedback-semanal | WARN | `{"name":"feedback-semanal","status":"WARN","email":"not_sent","recipients":1,"dry_run":false}` |
| Integracoes externas | relatorio-mensal | WARN | `{"name":"relatorio-mensal","status":"WARN","email":"not_sent","recipients":1,"dry_run":false}` |
| Integracoes externas | send-visit-report | PASS | `{"name":"send-visit-report","status":"PASS","email":"sent","warnings":[],"message":"sent"}` |
| Integracoes externas | google-calendar-sync | PASS | `{"name":"google-calendar-sync","status":"PASS","message":"{\"ok\":true,\"centralConnected\":true,\"userConnected\":true,\"errors\":[]}"}` |
| Integracoes externas | reports, visit email and calendar sync | PASS | `{"duration_ms":8988,"integrations":5,"sent":1}` |
| Downloads | CLI workbook exports | PASS | `{"duration_ms":117,"files":[{"name":"lojas-20260710055707.xlsx","bytes":16078},{"name":"matinal-api-20260710055707.xlsx","bytes":22697},{"name":"produtos-20260710055707.xlsx","bytes":16077},{"name":"consultoria-20260710055707.xlsx","bytes":16083}]}` |
| UI rotas | Painel Geral | PASS | `{"route":"/painel","status":200,"text_length":16415}` |
| UI rotas | Lojas | PASS | `{"route":"/lojas","status":200,"text_length":42380}` |
| UI rotas | Loja Dashboard E2E | PASS | `{"route":"/lojas/e2e-admin-master-20260710055707-editada","status":200,"text_length":5129}` |
| UI rotas | Loja Equipe E2E | PASS | `{"route":"/lojas/e2e-admin-master-20260710055707-editada?tab=equipe","status":200,"text_length":4177}` |
| UI rotas | Consultoria | PASS | `{"route":"/consultoria/clientes","status":200,"text_length":4335}` |
| UI rotas | Consultoria Cliente E2E | PASS | `{"route":"/consultoria/clientes/e2e-admin-master-20260710055707","status":200,"text_length":771}` |
| UI rotas | Consultoria Visita E2E | PASS | `{"route":"/consultoria/clientes/e2e-admin-master-20260710055707/visitas/1","status":200,"text_length":2592}` |
| UI rotas | Agenda | PASS | `{"route":"/agenda","status":200,"text_length":2760}` |
| UI rotas | Benchmarks | PASS | `{"route":"/relatorios/performance-vendas","status":200,"text_length":15137}` |
| UI rotas | Performance Vendedor | PASS | `{"route":"/relatorios/performance-vendedor","status":200,"text_length":7148}` |
| UI rotas | Classificacao | PASS | `{"route":"/classificacao","status":200,"text_length":1476}` |
| UI rotas | Matinal Oficial | PASS | `{"route":"/relatorio-matinal","status":200,"text_length":8051}` |
| UI rotas | Devolutivas PDI | PASS | `{"route":"/devolutivas","status":200,"text_length":711}` |
| UI rotas | PDI | PASS | `{"route":"/pdi","status":200,"text_length":619}` |
| UI rotas | Rotina | PASS | `{"route":"/rotina","status":200,"text_length":3738}` |
| UI rotas | Treinamentos | PASS | `{"route":"/treinamentos","status":200,"text_length":3670}` |
| UI rotas | Produtos Digitais | PASS | `{"route":"/produtos","status":200,"text_length":2234}` |
| UI rotas | Notificacoes | PASS | `{"route":"/notificacoes","status":200,"text_length":20742}` |
| UI rotas | Configuracao Operacional | PASS | `{"route":"/configuracoes/operacional","status":200,"text_length":4631}` |
| UI rotas | Parametros PMR | PASS | `{"route":"/configuracoes/consultoria-pmr","status":200,"text_length":5774}` |
| UI rotas | Reprocessamento | PASS | `{"route":"/configuracoes/reprocessamento","status":200,"text_length":3849}` |
| UI rotas | Auditoria | PASS | `{"route":"/auditoria","status":200,"text_length":1233}` |
| UI rotas | Configuracoes | PASS | `{"route":"/configuracoes","status":200,"text_length":1637}` |
| UI rotas | Configuracoes perfil | PASS | `{"route":"/configuracoes?aba=perfil","status":200,"text_length":1637}` |
| UI rotas | Configuracoes seguranca | PASS | `{"route":"/configuracoes?aba=seguranca","status":200,"text_length":1777}` |
| UI rotas | Configuracoes notificacoes | PASS | `{"route":"/configuracoes?aba=notificacoes","status":200,"text_length":2086}` |
| UI rotas | Configuracoes equipe-usuarios | PASS | `{"route":"/configuracoes?aba=equipe-usuarios","status":200,"text_length":24533}` |
| UI rotas | Configuracoes lojas-rede | PASS | `{"route":"/configuracoes?aba=lojas-rede","status":200,"text_length":15610}` |
| UI rotas | Configuracoes operacional-loja | PASS | `{"route":"/configuracoes?aba=operacional-loja","status":200,"text_length":5752}` |
| UI rotas | Configuracoes consultoria-pmr | PASS | `{"route":"/configuracoes?aba=consultoria-pmr","status":200,"text_length":7072}` |
| UI rotas | Configuracoes catalogos | PASS | `{"route":"/configuracoes?aba=catalogos","status":200,"text_length":4685}` |
| UI rotas | Configuracoes broadcasts | PASS | `{"route":"/configuracoes?aba=broadcasts","status":200,"text_length":1520}` |
| UI rotas | Configuracoes integracoes | PASS | `{"route":"/configuracoes?aba=integracoes","status":200,"text_length":2705}` |
| UI rotas | Configuracoes sistema-mx | PASS | `{"route":"/configuracoes?aba=sistema-mx","status":200,"text_length":2844}` |
| UI rotas | Configuracoes aparencia | PASS | `{"route":"/configuracoes?aba=aparencia","status":200,"text_length":1836}` |
| UI downloads | Matinal XLSX | PASS | `{"file":"output/e2e-admin-master-full-20260710055707/downloads/ui-matinal-20260710055707.xlsx","bytes":54049}` |
| UI downloads | Performance XLSX | PASS | `{"file":"output/e2e-admin-master-full-20260710055707/downloads/ui-performance-20260710055707.xlsx","bytes":101052}` |
| UI downloads | ROI PDF | PASS | `{"file":"output/e2e-admin-master-full-20260710055707/downloads/ui-roi-20260710055707.pdf","bytes":5911}` |
| UI | production navigation, tabs and browser downloads | PASS | `{"duration_ms":111643,"routes":35,"failed_routes":0,"screenshots":37}` |
| Limpeza | cleanup registry | PASS | `{"cleanupWarnings":[],"checks":[{"table":"lojas","count":0,"error":null},{"table":"usuarios","count":0,"error":null},{"table":"clientes_consultoria","count":0,"error":null},{"table":"produtos_digitais","count":0,"error":null},{"table":"eventos_agenda_consultoria","count":0,"error":null},{"table":"visitas_consultoria","count":0,"error":null}]}` |
| Limpeza | leftover verification | PASS | `{"leftovers":[],"checks":[{"table":"lojas","count":0,"error":null},{"table":"usuarios","count":0,"error":null},{"table":"clientes_consultoria","count":0,"error":null},{"table":"produtos_digitais","count":0,"error":null},{"table":"eventos_agenda_consultoria","count":0,"error":null},{"table":"visitas_consultoria","count":0,"error":null}]}` |

## Artefatos

- `output/e2e-admin-master-full-20260710055707/downloads/lojas-20260710055707.xlsx`
- `output/e2e-admin-master-full-20260710055707/downloads/matinal-api-20260710055707.xlsx`
- `output/e2e-admin-master-full-20260710055707/downloads/produtos-20260710055707.xlsx`
- `output/e2e-admin-master-full-20260710055707/downloads/consultoria-20260710055707.xlsx`
- `output/e2e-admin-master-full-20260710055707/screenshots/05-login-dashboard.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/06-painel-geral.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/07-lojas.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/08-loja-dashboard-e2e.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/09-loja-equipe-e2e.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/10-consultoria.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/11-consultoria-cliente-e2e.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/12-consultoria-visita-e2e.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/13-agenda.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/14-benchmarks.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/15-performance-vendedor.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/16-classificacao.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/17-matinal-oficial.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/18-devolutivas-pdi.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/19-pdi.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/20-rotina.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/21-treinamentos.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/22-produtos-digitais.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/23-notificacoes.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/24-configuracao-operacional.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/25-parametros-pmr.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/26-reprocessamento.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/27-auditoria.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/28-configuracoes.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/29-configuracoes-perfil.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/30-configuracoes-seguranca.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/31-configuracoes-notificacoes.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/32-configuracoes-equipe-usuarios.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/33-configuracoes-lojas-rede.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/34-configuracoes-operacional-loja.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/35-configuracoes-consultoria-pmr.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/36-configuracoes-catalogos.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/37-configuracoes-broadcasts.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/38-configuracoes-integracoes.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/39-configuracoes-sistema-mx.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/40-configuracoes-aparencia.png`
- `output/e2e-admin-master-full-20260710055707/downloads/ui-matinal-20260710055707.xlsx`
- `output/e2e-admin-master-full-20260710055707/downloads/ui-performance-20260710055707.xlsx`
- `output/e2e-admin-master-full-20260710055707/downloads/ui-roi-20260710055707.pdf`
- `output/e2e-admin-master-full-20260710055707/screenshots/44-mobile-painel.png`
- `output/e2e-admin-master-full-20260710055707/screenshots/45-mobile-menu.png`
- `output/e2e-admin-master-full-20260710055707/cleanup-registry.json`

## Limpeza

- Todos os registros E2E conhecidos foram removidos ou verificados no bloco de limpeza.
- A conta real validada foi preservada: papel, usuario e senha nao foram alterados pelo runner.
