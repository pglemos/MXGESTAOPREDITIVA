# Validacao E2E Admin Master MX - 20260503052018

- Run ID: `E2E_ADMIN_MASTER_20260503052018`
- Usuario validado: `[EMAIL_REDACTED]`
- Ambiente: `https://mxperformance.vercel.app`
- Status geral: `PASS`
- Senha: nao registrada neste artefato.

## Resumo

| Status | Total |
| --- | ---: |
| PASS | 55 |
| WARN | 0 |
| FAIL | 0 |
| BLOCKED | 0 |

## Resultados

| Secao | Validacao | Status | Detalhes |
| --- | --- | --- | --- |
| Preflight | account, role and password login | PASS | `{"duration_ms":1536,"profile":{"id":"9b9ee2fb-d002-492f-b274-06846972a014","email":"[EMAIL_REDACTED]","name":"Synvollt","role":"administrador_geral","active":true,"must_change_password":false}}` |
| Preflight | permission matrix | PASS | `{"duration_ms":149,"modules":7,"permission_codes":["comparar","criar","editar","excluir","exportar","visualizar"],"matrix_rows":24,"delete_permissions":5,"export_permissions":1}` |
| CLI/API | store CRUD and operational rules | PASS | `{"duration_ms":605,"store_id":"d9bdb60e-4ed7-4c67-9c01-6e19938701ae","store_name":"E2E ADMIN MASTER 20260503052018 EDITADA","manager_email":"[EMAIL_REDACTED]"}` |
| CLI/API | team/user CRUD, seller tenure and checkins | PASS | `{"duration_ms":1522,"user_id":"83518ba8-327e-4782-a219-e25606cf4dd4","feedback_id":"9e3e5050-7252-4fde-be45-313020b74d30","checkin_rows":4}` |
| CLI/API | digital product CRUD | PASS | `{"duration_ms":209,"product_id":"b4005358-41c7-4fe3-b33f-e7cbd7722c8f","status":"ativo"}` |
| CLI/API | consulting client, visit and agenda CRUD | PASS | `{"duration_ms":544,"client_id":"3f7d0e9d-b3db-471e-99d3-1a88c59ae59c","visit_id":"cb4dead9-fcdf-4441-8a16-bbf3ddc180a5","event_id":"8553b74d-54cc-4819-9649-32a8aad8539d","slug":"e2e-admin-master-20260503052018"}` |
| CLI/API | evidence upload and visit completion | PASS | `{"duration_ms":770,"negative_without_evidence_ok":true,"evidence_id":"212c178d-5e2c-4b8e-bd84-43499e68e47c","completed_status":"concluida"}` |
| Integracoes externas | relatorio-matinal | PASS | `{"name":"relatorio-matinal","status":"PASS","email":"sent","recipients":1,"dry_run":false}` |
| Integracoes externas | feedback-semanal | PASS | `{"name":"feedback-semanal","status":"PASS","email":"sent","recipients":1,"dry_run":false}` |
| Integracoes externas | relatorio-mensal | PASS | `{"name":"relatorio-mensal","status":"PASS","email":"sent","recipients":1,"dry_run":false}` |
| Integracoes externas | send-visit-report | PASS | `{"name":"send-visit-report","status":"PASS","email":"sent","warnings":[],"message":"sent"}` |
| Integracoes externas | google-calendar-sync | PASS | `{"name":"google-calendar-sync","status":"PASS","message":"{\"ok\":true,\"centralConnected\":true,\"userConnected\":false,\"errors\":[]}"}` |
| Integracoes externas | reports, visit email and calendar sync | PASS | `{"duration_ms":9441,"integrations":5,"sent":4}` |
| Downloads | CLI workbook exports | PASS | `{"duration_ms":212,"files":[{"name":"lojas-20260503052018.xlsx","bytes":16078},{"name":"matinal-api-20260503052018.xlsx","bytes":21518},{"name":"produtos-20260503052018.xlsx","bytes":16077},{"name":"consultoria-20260503052018.xlsx","bytes":16083}]}` |
| UI rotas | Painel Geral | PASS | `{"route":"/painel","status":200,"text_length":3744}` |
| UI rotas | Lojas | PASS | `{"route":"/lojas","status":200,"text_length":2967}` |
| UI rotas | Loja Dashboard E2E | PASS | `{"route":"/lojas/e2e-admin-master-20260503052018-editada","status":200,"text_length":1803}` |
| UI rotas | Loja Equipe E2E | PASS | `{"route":"/lojas/e2e-admin-master-20260503052018-editada?tab=equipe","status":200,"text_length":818}` |
| UI rotas | Consultoria | PASS | `{"route":"/consultoria/clientes","status":200,"text_length":3916}` |
| UI rotas | Consultoria Cliente E2E | PASS | `{"route":"/consultoria/clientes/e2e-admin-master-20260503052018","status":200,"text_length":437}` |
| UI rotas | Consultoria Visita E2E | PASS | `{"route":"/consultoria/clientes/e2e-admin-master-20260503052018/visitas/1","status":200,"text_length":1928}` |
| UI rotas | Agenda | PASS | `{"route":"/agenda","status":200,"text_length":1132}` |
| UI rotas | Benchmarks | PASS | `{"route":"/relatorios/performance-vendas","status":200,"text_length":4590}` |
| UI rotas | Performance Vendedor | PASS | `{"route":"/relatorios/performance-vendedor","status":200,"text_length":3561}` |
| UI rotas | Classificacao | PASS | `{"route":"/classificacao","status":200,"text_length":7148}` |
| UI rotas | Matinal Oficial | PASS | `{"route":"/relatorio-matinal","status":200,"text_length":2138}` |
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
| UI rotas | Configuracoes lojas-rede | PASS | `{"route":"/configuracoes?aba=lojas-rede","status":200,"text_length":3178}` |
| UI rotas | Configuracoes operacional-loja | PASS | `{"route":"/configuracoes?aba=operacional-loja","status":200,"text_length":2111}` |
| UI rotas | Configuracoes consultoria-pmr | PASS | `{"route":"/configuracoes?aba=consultoria-pmr","status":200,"text_length":4403}` |
| UI rotas | Configuracoes catalogos | PASS | `{"route":"/configuracoes?aba=catalogos","status":200,"text_length":1140}` |
| UI rotas | Configuracoes broadcasts | PASS | `{"route":"/configuracoes?aba=broadcasts","status":200,"text_length":897}` |
| UI rotas | Configuracoes integracoes | PASS | `{"route":"/configuracoes?aba=integracoes","status":200,"text_length":2140}` |
| UI rotas | Configuracoes sistema-mx | PASS | `{"route":"/configuracoes?aba=sistema-mx","status":200,"text_length":1654}` |
| UI rotas | Configuracoes aparencia | PASS | `{"route":"/configuracoes?aba=aparencia","status":200,"text_length":1222}` |
| UI downloads | Matinal XLSX | PASS | `{"file":"output/e2e-admin-master-full-20260503052018/downloads/ui-matinal-20260503052018.xlsx","bytes":26479}` |
| UI downloads | Performance XLSX | PASS | `{"file":"output/e2e-admin-master-full-20260503052018/downloads/ui-performance-20260503052018.xlsx","bytes":35357}` |
| UI downloads | ROI PDF | PASS | `{"file":"output/e2e-admin-master-full-20260503052018/downloads/ui-roi-20260503052018.pdf","bytes":5778}` |
| UI | production navigation, tabs and browser downloads | PASS | `{"duration_ms":96351,"routes":35,"failed_routes":0,"screenshots":37}` |
| Limpeza | cleanup registry | PASS | `{"cleanupWarnings":[],"checks":[{"table":"lojas","count":0,"error":null},{"table":"usuarios","count":0,"error":null},{"table":"clientes_consultoria","count":0,"error":null},{"table":"produtos_digitais","count":0,"error":null},{"table":"eventos_agenda_consultoria","count":0,"error":null},{"table":"visitas_consultoria","count":0,"error":null}]}` |
| Limpeza | leftover verification | PASS | `{"leftovers":[],"checks":[{"table":"lojas","count":0,"error":null},{"table":"usuarios","count":0,"error":null},{"table":"clientes_consultoria","count":0,"error":null},{"table":"produtos_digitais","count":0,"error":null},{"table":"eventos_agenda_consultoria","count":0,"error":null},{"table":"visitas_consultoria","count":0,"error":null}]}` |

## Artefatos

- `output/e2e-admin-master-full-20260503052018/downloads/lojas-20260503052018.xlsx`
- `output/e2e-admin-master-full-20260503052018/downloads/matinal-api-20260503052018.xlsx`
- `output/e2e-admin-master-full-20260503052018/downloads/produtos-20260503052018.xlsx`
- `output/e2e-admin-master-full-20260503052018/downloads/consultoria-20260503052018.xlsx`
- `output/e2e-admin-master-full-20260503052018/screenshots/05-login-dashboard.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/06-painel-geral.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/07-lojas.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/08-loja-dashboard-e2e.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/09-loja-equipe-e2e.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/10-consultoria.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/11-consultoria-cliente-e2e.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/12-consultoria-visita-e2e.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/13-agenda.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/14-benchmarks.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/15-performance-vendedor.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/16-classificacao.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/17-matinal-oficial.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/18-devolutivas-pdi.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/19-pdi.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/20-rotina.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/21-treinamentos.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/22-produtos-digitais.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/23-notificacoes.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/24-configuracao-operacional.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/25-parametros-pmr.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/26-reprocessamento.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/27-auditoria.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/28-configuracoes.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/29-configuracoes-perfil.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/30-configuracoes-seguranca.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/31-configuracoes-notificacoes.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/32-configuracoes-equipe-usuarios.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/33-configuracoes-lojas-rede.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/34-configuracoes-operacional-loja.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/35-configuracoes-consultoria-pmr.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/36-configuracoes-catalogos.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/37-configuracoes-broadcasts.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/38-configuracoes-integracoes.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/39-configuracoes-sistema-mx.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/40-configuracoes-aparencia.png`
- `output/e2e-admin-master-full-20260503052018/downloads/ui-matinal-20260503052018.xlsx`
- `output/e2e-admin-master-full-20260503052018/downloads/ui-performance-20260503052018.xlsx`
- `output/e2e-admin-master-full-20260503052018/downloads/ui-roi-20260503052018.pdf`
- `output/e2e-admin-master-full-20260503052018/screenshots/44-mobile-painel.png`
- `output/e2e-admin-master-full-20260503052018/screenshots/45-mobile-menu.png`
- `output/e2e-admin-master-full-20260503052018/cleanup-registry.json`

## Limpeza

- Todos os registros E2E conhecidos foram removidos ou verificados no bloco de limpeza.
- A conta real validada foi preservada: papel, usuario e senha nao foram alterados pelo runner.
