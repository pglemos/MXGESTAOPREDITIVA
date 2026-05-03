# Validacao E2E Admin Master MX - 20260503042149

- Run ID: `E2E_ADMIN_MASTER_20260503042149`
- Usuario validado: `synvollt@gmail.com`
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
| Preflight | account, role and password login | PASS | `{"duration_ms":2248,"profile":{"id":"9b9ee2fb-d002-492f-b274-06846972a014","email":"synvollt@gmail.com","name":"Synvollt","role":"administrador_geral","active":true,"must_change_password":false}}` |
| Preflight | permission matrix | PASS | `{"duration_ms":305,"modules":7,"permission_codes":["comparar","criar","editar","excluir","exportar","visualizar"],"matrix_rows":24,"delete_permissions":5,"export_permissions":1}` |
| CLI/API | store CRUD and operational rules | PASS | `{"duration_ms":617,"store_id":"80ca497a-10ce-4d72-a70b-751a72bd2543","store_name":"E2E ADMIN MASTER 20260503042149 EDITADA","manager_email":"synvollt@gmail.com"}` |
| CLI/API | team/user CRUD, seller tenure and checkins | PASS | `{"duration_ms":2486,"user_id":"16f5f97f-2be7-4958-bf2d-d6d3a605e7aa","feedback_id":"ec594b32-40ad-47b6-976f-bf236834f7a3","checkin_rows":4}` |
| CLI/API | digital product CRUD | PASS | `{"duration_ms":302,"product_id":"5527e060-7e40-431e-95ba-39939c3d295d","status":"ativo"}` |
| CLI/API | consulting client, visit and agenda CRUD | PASS | `{"duration_ms":663,"client_id":"a616bbd6-5963-4291-9ef5-30f229f8db59","visit_id":"1cd91ed8-58b6-4d1f-b5fd-8dc56bb645be","event_id":"6b8c9a17-79b7-4023-abb1-66e8898f62fa","slug":"e2e-admin-master-20260503042149"}` |
| CLI/API | evidence upload and visit completion | PASS | `{"duration_ms":828,"negative_without_evidence_ok":true,"evidence_id":"a386860a-ed23-444f-a4ff-ef59a1274949","completed_status":"concluida"}` |
| Integracoes externas | relatorio-matinal | PASS | `{"name":"relatorio-matinal","status":"PASS","email":"sent","recipients":1,"dry_run":false}` |
| Integracoes externas | feedback-semanal | PASS | `{"name":"feedback-semanal","status":"PASS","email":"sent","recipients":1,"dry_run":false}` |
| Integracoes externas | relatorio-mensal | PASS | `{"name":"relatorio-mensal","status":"PASS","email":"sent","recipients":1,"dry_run":false}` |
| Integracoes externas | send-visit-report | PASS | `{"name":"send-visit-report","status":"PASS","email":"sent","warnings":[],"message":"sent"}` |
| Integracoes externas | google-calendar-sync | PASS | `{"name":"google-calendar-sync","status":"PASS","message":"{\"ok\":true,\"centralConnected\":true,\"userConnected\":false,\"errors\":[]}"}` |
| Integracoes externas | reports, visit email and calendar sync | PASS | `{"duration_ms":13927,"integrations":5,"sent":4}` |
| Downloads | CLI workbook exports | PASS | `{"duration_ms":649,"files":[{"name":"lojas-20260503042149.xlsx","bytes":16078},{"name":"matinal-api-20260503042149.xlsx","bytes":21510},{"name":"produtos-20260503042149.xlsx","bytes":16077},{"name":"consultoria-20260503042149.xlsx","bytes":16083}]}` |
| UI rotas | Painel Geral | PASS | `{"route":"/painel","status":200,"text_length":3744}` |
| UI rotas | Lojas | PASS | `{"route":"/lojas","status":200,"text_length":2967}` |
| UI rotas | Loja Dashboard E2E | PASS | `{"route":"/lojas/e2e-admin-master-20260503042149-editada","status":200,"text_length":1803}` |
| UI rotas | Loja Equipe E2E | PASS | `{"route":"/lojas/e2e-admin-master-20260503042149-editada?tab=equipe","status":200,"text_length":818}` |
| UI rotas | Consultoria | PASS | `{"route":"/consultoria/clientes","status":200,"text_length":3916}` |
| UI rotas | Consultoria Cliente E2E | PASS | `{"route":"/consultoria/clientes/e2e-admin-master-20260503042149","status":200,"text_length":437}` |
| UI rotas | Consultoria Visita E2E | PASS | `{"route":"/consultoria/clientes/e2e-admin-master-20260503042149/visitas/1","status":200,"text_length":1928}` |
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
| UI rotas | Auditoria | PASS | `{"route":"/auditoria","status":200,"text_length":736}` |
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
| UI rotas | Configuracoes sistema-mx | PASS | `{"route":"/configuracoes?aba=sistema-mx","status":200,"text_length":1655}` |
| UI rotas | Configuracoes aparencia | PASS | `{"route":"/configuracoes?aba=aparencia","status":200,"text_length":1222}` |
| UI downloads | Matinal XLSX | PASS | `{"file":"output/e2e-admin-master-full-20260503042149/downloads/ui-matinal-20260503042149.xlsx","bytes":26479}` |
| UI downloads | Performance XLSX | PASS | `{"file":"output/e2e-admin-master-full-20260503042149/downloads/ui-performance-20260503042149.xlsx","bytes":35357}` |
| UI downloads | ROI PDF | PASS | `{"file":"output/e2e-admin-master-full-20260503042149/downloads/ui-roi-20260503042149.pdf","bytes":5778}` |
| UI | production navigation, tabs and browser downloads | PASS | `{"duration_ms":101447,"routes":35,"failed_routes":0,"screenshots":37}` |
| Limpeza | cleanup registry | PASS | `{"cleanupWarnings":[],"checks":[{"table":"lojas","count":0,"error":null},{"table":"usuarios","count":0,"error":null},{"table":"clientes_consultoria","count":0,"error":null},{"table":"produtos_digitais","count":0,"error":null},{"table":"eventos_agenda_consultoria","count":0,"error":null},{"table":"visitas_consultoria","count":0,"error":null}]}` |
| Limpeza | leftover verification | PASS | `{"leftovers":[],"checks":[{"table":"lojas","count":0,"error":null},{"table":"usuarios","count":0,"error":null},{"table":"clientes_consultoria","count":0,"error":null},{"table":"produtos_digitais","count":0,"error":null},{"table":"eventos_agenda_consultoria","count":0,"error":null},{"table":"visitas_consultoria","count":0,"error":null}]}` |

## Artefatos

- `output/e2e-admin-master-full-20260503042149/downloads/lojas-20260503042149.xlsx`
- `output/e2e-admin-master-full-20260503042149/downloads/matinal-api-20260503042149.xlsx`
- `output/e2e-admin-master-full-20260503042149/downloads/produtos-20260503042149.xlsx`
- `output/e2e-admin-master-full-20260503042149/downloads/consultoria-20260503042149.xlsx`
- `output/e2e-admin-master-full-20260503042149/screenshots/05-login-dashboard.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/06-painel-geral.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/07-lojas.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/08-loja-dashboard-e2e.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/09-loja-equipe-e2e.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/10-consultoria.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/11-consultoria-cliente-e2e.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/12-consultoria-visita-e2e.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/13-agenda.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/14-benchmarks.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/15-performance-vendedor.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/16-classificacao.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/17-matinal-oficial.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/18-devolutivas-pdi.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/19-pdi.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/20-rotina.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/21-treinamentos.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/22-produtos-digitais.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/23-notificacoes.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/24-configuracao-operacional.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/25-parametros-pmr.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/26-reprocessamento.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/27-auditoria.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/28-configuracoes.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/29-configuracoes-perfil.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/30-configuracoes-seguranca.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/31-configuracoes-notificacoes.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/32-configuracoes-equipe-usuarios.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/33-configuracoes-lojas-rede.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/34-configuracoes-operacional-loja.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/35-configuracoes-consultoria-pmr.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/36-configuracoes-catalogos.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/37-configuracoes-broadcasts.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/38-configuracoes-integracoes.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/39-configuracoes-sistema-mx.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/40-configuracoes-aparencia.png`
- `output/e2e-admin-master-full-20260503042149/downloads/ui-matinal-20260503042149.xlsx`
- `output/e2e-admin-master-full-20260503042149/downloads/ui-performance-20260503042149.xlsx`
- `output/e2e-admin-master-full-20260503042149/downloads/ui-roi-20260503042149.pdf`
- `output/e2e-admin-master-full-20260503042149/screenshots/44-mobile-painel.png`
- `output/e2e-admin-master-full-20260503042149/screenshots/45-mobile-menu.png`
- `output/e2e-admin-master-full-20260503042149/cleanup-registry.json`

## Limpeza

- Todos os registros E2E conhecidos foram removidos ou verificados no bloco de limpeza.
- A conta real validada foi preservada: papel, usuario e senha nao foram alterados pelo runner.
