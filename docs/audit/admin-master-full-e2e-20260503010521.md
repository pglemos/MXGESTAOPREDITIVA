# Validacao E2E Admin Master MX - 20260503010521

- Run ID: `E2E_ADMIN_MASTER_20260503010521`
- Usuario validado: `synvollt@gmail.com`
- Ambiente: `https://mxperformance.vercel.app`
- Status geral: `FAIL`
- Senha: nao registrada neste artefato.

## Resumo

| Status | Total |
| --- | ---: |
| PASS | 50 |
| WARN | 5 |
| FAIL | 2 |
| BLOCKED | 0 |

## Resultados

| Secao | Validacao | Status | Detalhes |
| --- | --- | --- | --- |
| Preflight | account, role and password login | PASS | `{"duration_ms":605,"profile":{"id":"9b9ee2fb-d002-492f-b274-06846972a014","email":"synvollt@gmail.com","name":"Synvollt","role":"administrador_geral","active":true,"must_change_password":false}}` |
| Preflight | permission matrix | PASS | `{"duration_ms":134,"modules":7,"permission_codes":["comparar","criar","editar","excluir","exportar","visualizar"],"matrix_rows":24,"delete_permissions":5,"export_permissions":1}` |
| CLI/API | store CRUD and operational rules | PASS | `{"duration_ms":706,"store_id":"a3b6b454-1f4d-444e-8045-2f5d92792d52","store_name":"E2E ADMIN MASTER 20260503010521 EDITADA","manager_email":"synvollt@gmail.com"}` |
| CLI/API | seller tenure upsert constraint | FAIL | `{"message":"there is no unique or exclusion constraint matching the ON CONFLICT specification"}` |
| CLI/API | daily checkins upsert constraint | FAIL | `{"message":"there is no unique or exclusion constraint matching the ON CONFLICT specification"}` |
| CLI/API | team/user CRUD, seller tenure and checkins | PASS | `{"duration_ms":1144,"user_id":"fc216e91-1739-4247-b0ff-1ab7d4804c1b","feedback_id":"1dbf9cf0-cc2c-4b1c-8a2f-9cbe739e67ae","checkin_rows":4}` |
| CLI/API | digital product CRUD | PASS | `{"duration_ms":143,"product_id":"a6eca75c-9888-4ef7-a648-9488d4831baf","status":"ativo"}` |
| CLI/API | consulting client, visit and agenda CRUD | PASS | `{"duration_ms":438,"client_id":"23543954-d4b0-48da-b60f-ed72f851b80c","visit_id":"39143103-4e7b-4744-86d1-59839df87ceb","event_id":"6b42be15-debd-4d1a-9559-08611fc93899","slug":"e2e-admin-master-20260503010521"}` |
| CLI/API | evidence upload and visit completion | PASS | `{"duration_ms":740,"negative_without_evidence_ok":true,"evidence_id":"1131f00a-bd6f-4366-b3df-1a1164306bc1","completed_status":"concluida"}` |
| Integracoes externas | relatorio-matinal | WARN | `{"name":"relatorio-matinal","status":"WARN","email":"not_sent","recipients":1,"dry_run":false}` |
| Integracoes externas | feedback-semanal | WARN | `{"name":"feedback-semanal","status":"WARN","email":"not_sent","recipients":1,"dry_run":false}` |
| Integracoes externas | relatorio-mensal | WARN | `{"name":"relatorio-mensal","status":"WARN","email":"not_sent","recipients":1,"dry_run":false}` |
| Integracoes externas | send-visit-report | WARN | `{"name":"send-visit-report","status":"WARN","message":"API key is invalid"}` |
| Integracoes externas | google-calendar-sync | PASS | `{"name":"google-calendar-sync","status":"PASS","message":"{\"ok\":true,\"centralConnected\":true,\"userConnected\":false,\"errors\":[]}"}` |
| Integracoes externas | reports, visit email and calendar sync | PASS | `{"duration_ms":3304,"integrations":5,"sent":0}` |
| Downloads | CLI workbook exports | PASS | `{"duration_ms":174,"files":[{"name":"lojas-20260503010521.xlsx","bytes":16078},{"name":"matinal-api-20260503010521.xlsx","bytes":21506},{"name":"produtos-20260503010521.xlsx","bytes":16077},{"name":"consultoria-20260503010521.xlsx","bytes":16083}]}` |
| UI rotas | Painel Geral | PASS | `{"route":"/painel","status":200,"text_length":3747}` |
| UI rotas | Lojas | PASS | `{"route":"/lojas","status":200,"text_length":2965}` |
| UI rotas | Loja Dashboard E2E | PASS | `{"route":"/lojas/e2e-admin-master-20260503010521-editada","status":200,"text_length":1803}` |
| UI rotas | Loja Equipe E2E | PASS | `{"route":"/lojas/e2e-admin-master-20260503010521-editada?tab=equipe","status":200,"text_length":814}` |
| UI rotas | Consultoria | PASS | `{"route":"/consultoria/clientes","status":200,"text_length":3916}` |
| UI rotas | Consultoria Cliente E2E | PASS | `{"route":"/consultoria/clientes/e2e-admin-master-20260503010521","status":200,"text_length":437}` |
| UI rotas | Consultoria Visita E2E | PASS | `{"route":"/consultoria/clientes/e2e-admin-master-20260503010521/visitas/1","status":200,"text_length":1928}` |
| UI rotas | Agenda | PASS | `{"route":"/agenda","status":200,"text_length":1134}` |
| UI rotas | Benchmarks | PASS | `{"route":"/relatorios/performance-vendas","status":200,"text_length":4590}` |
| UI rotas | Performance Vendedor | PASS | `{"route":"/relatorios/performance-vendedor","status":200,"text_length":3561}` |
| UI rotas | Classificacao | PASS | `{"route":"/classificacao","status":200,"text_length":7148}` |
| UI rotas | Matinal Oficial | PASS | `{"route":"/relatorio-matinal","status":200,"text_length":2137}` |
| UI rotas | Devolutivas PDI | PASS | `{"route":"/devolutivas","status":200,"text_length":294}` |
| UI rotas | PDI | PASS | `{"route":"/pdi","status":200,"text_length":255}` |
| UI rotas | Rotina | PASS | `{"route":"/rotina","status":200,"text_length":636}` |
| UI rotas | Treinamentos | PASS | `{"route":"/treinamentos","status":200,"text_length":461}` |
| UI rotas | Produtos Digitais | PASS | `{"route":"/produtos","status":200,"text_length":460}` |
| UI rotas | Notificacoes | PASS | `{"route":"/notificacoes","status":200,"text_length":204}` |
| UI rotas | Configuracao Operacional | PASS | `{"route":"/configuracoes/operacional","status":200,"text_length":1463}` |
| UI rotas | Parametros PMR | PASS | `{"route":"/configuracoes/consultoria-pmr","status":200,"text_length":3394}` |
| UI rotas | Reprocessamento | PASS | `{"route":"/configuracoes/reprocessamento","status":200,"text_length":737}` |
| UI rotas | Auditoria | PASS | `{"route":"/auditoria","status":200,"text_length":539}` |
| UI rotas | Configuracoes | PASS | `{"route":"/configuracoes","status":200,"text_length":1036}` |
| UI rotas | Configuracoes perfil | PASS | `{"route":"/configuracoes?aba=perfil","status":200,"text_length":1036}` |
| UI rotas | Configuracoes seguranca | PASS | `{"route":"/configuracoes?aba=seguranca","status":200,"text_length":1121}` |
| UI rotas | Configuracoes notificacoes | PASS | `{"route":"/configuracoes?aba=notificacoes","status":200,"text_length":1369}` |
| UI rotas | Configuracoes equipe-usuarios | PASS | `{"route":"/configuracoes?aba=equipe-usuarios","status":200,"text_length":9493}` |
| UI rotas | Configuracoes lojas-rede | PASS | `{"route":"/configuracoes?aba=lojas-rede","status":200,"text_length":3176}` |
| UI rotas | Configuracoes operacional-loja | PASS | `{"route":"/configuracoes?aba=operacional-loja","status":200,"text_length":2111}` |
| UI rotas | Configuracoes consultoria-pmr | PASS | `{"route":"/configuracoes?aba=consultoria-pmr","status":200,"text_length":4403}` |
| UI rotas | Configuracoes catalogos | PASS | `{"route":"/configuracoes?aba=catalogos","status":200,"text_length":1140}` |
| UI rotas | Configuracoes broadcasts | PASS | `{"route":"/configuracoes?aba=broadcasts","status":200,"text_length":897}` |
| UI rotas | Configuracoes integracoes | PASS | `{"route":"/configuracoes?aba=integracoes","status":200,"text_length":2140}` |
| UI rotas | Configuracoes sistema-mx | PASS | `{"route":"/configuracoes?aba=sistema-mx","status":200,"text_length":1654}` |
| UI rotas | Configuracoes aparencia | PASS | `{"route":"/configuracoes?aba=aparencia","status":200,"text_length":1222}` |
| UI downloads | Matinal XLSX | PASS | `{"file":"output/e2e-admin-master-full-20260503010521/downloads/ui-matinal-20260503010521.xlsx","bytes":26479}` |
| UI downloads | Performance XLSX | PASS | `{"file":"output/e2e-admin-master-full-20260503010521/downloads/ui-performance-20260503010521.xlsx","bytes":35357}` |
| UI downloads | ROI PDF | WARN | `{"message":"page.waitForEvent: Timeout 30000ms exceeded while waiting for event \"download\"\n=========================== logs ===========================\nwaiting for event \"download\"\n============================================================"}` |
| UI | production navigation, tabs and browser downloads | PASS | `{"duration_ms":119070,"routes":35,"failed_routes":0,"screenshots":37}` |
| Limpeza | cleanup registry | PASS | `{"cleanupWarnings":[],"checks":[{"table":"lojas","count":0,"error":null},{"table":"usuarios","count":0,"error":null},{"table":"clientes_consultoria","count":0,"error":null},{"table":"produtos_digitais","count":0,"error":null},{"table":"eventos_agenda_consultoria","count":0,"error":null},{"table":"visitas_consultoria","count":0,"error":null}]}` |
| Limpeza | leftover verification | PASS | `{"leftovers":[],"checks":[{"table":"lojas","count":0,"error":null},{"table":"usuarios","count":0,"error":null},{"table":"clientes_consultoria","count":0,"error":null},{"table":"produtos_digitais","count":0,"error":null},{"table":"eventos_agenda_consultoria","count":0,"error":null},{"table":"visitas_consultoria","count":0,"error":null}]}` |

## Artefatos

- `output/e2e-admin-master-full-20260503010521/downloads/lojas-20260503010521.xlsx`
- `output/e2e-admin-master-full-20260503010521/downloads/matinal-api-20260503010521.xlsx`
- `output/e2e-admin-master-full-20260503010521/downloads/produtos-20260503010521.xlsx`
- `output/e2e-admin-master-full-20260503010521/downloads/consultoria-20260503010521.xlsx`
- `output/e2e-admin-master-full-20260503010521/screenshots/05-login-dashboard.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/06-painel-geral.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/07-lojas.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/08-loja-dashboard-e2e.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/09-loja-equipe-e2e.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/10-consultoria.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/11-consultoria-cliente-e2e.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/12-consultoria-visita-e2e.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/13-agenda.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/14-benchmarks.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/15-performance-vendedor.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/16-classificacao.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/17-matinal-oficial.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/18-devolutivas-pdi.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/19-pdi.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/20-rotina.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/21-treinamentos.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/22-produtos-digitais.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/23-notificacoes.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/24-configuracao-operacional.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/25-parametros-pmr.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/26-reprocessamento.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/27-auditoria.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/28-configuracoes.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/29-configuracoes-perfil.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/30-configuracoes-seguranca.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/31-configuracoes-notificacoes.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/32-configuracoes-equipe-usuarios.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/33-configuracoes-lojas-rede.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/34-configuracoes-operacional-loja.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/35-configuracoes-consultoria-pmr.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/36-configuracoes-catalogos.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/37-configuracoes-broadcasts.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/38-configuracoes-integracoes.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/39-configuracoes-sistema-mx.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/40-configuracoes-aparencia.png`
- `output/e2e-admin-master-full-20260503010521/downloads/ui-matinal-20260503010521.xlsx`
- `output/e2e-admin-master-full-20260503010521/downloads/ui-performance-20260503010521.xlsx`
- `output/e2e-admin-master-full-20260503010521/screenshots/43-mobile-painel.png`
- `output/e2e-admin-master-full-20260503010521/screenshots/44-mobile-menu.png`
- `output/e2e-admin-master-full-20260503010521/cleanup-registry.json`

## Limpeza

- Todos os registros E2E conhecidos foram removidos ou verificados no bloco de limpeza.
- A conta real validada foi preservada: papel, usuario e senha nao foram alterados pelo runner.
