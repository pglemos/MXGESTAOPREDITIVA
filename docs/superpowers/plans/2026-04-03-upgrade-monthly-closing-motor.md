# Upgrade Monthly Closing Motor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Monthly Closing report with Prestige branding (Gold/Midnight Blue) and CSV attachments.

**Architecture:** Refactor the `relatorio-mensal` Edge Function to include a CSV generation utility and a high-fidelity HTML template.

**Tech Stack:** Deno (Edge Runtime), Supabase, Resend, TypeScript.

---

### Task 1: CSV Generation Utility

**Files:**
- Modify: `supabase/functions/relatorio-mensal/index.ts`

- [ ] **Step 1: Implement `generateCSV` function**

Add the following function at the bottom of the file (or after `generateMonthlyHTML`):

```typescript
function generateCSV(ranking: any[]) {
    const headers = ["Vendedor", "Leads", "Agendamentos", "Visitas", "Vendas Porta", "Vendas Cartão", "Vendas Net", "Total Vendas"];
    const rows = ranking.map(r => [
        `"${r.name}"`,
        r.leads,
        r.agd,
        r.vis,
        r.vp,
        r.vc,
        r.vn,
        r.vt
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    
    const encoder = new TextEncoder();
    const data = encoder.encode(csvContent);
    const binString = Array.from(data, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString);
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/relatorio-mensal/index.ts
git commit -m "feat: add generateCSV utility to monthly report"
```

---

### Task 2: Refactor HTML Template (Prestige Design)

**Files:**
- Modify: `supabase/functions/relatorio-mensal/index.ts`

- [ ] **Step 1: Update `generateMonthlyHTML` with Prestige Branding**

Replace the current `generateMonthlyHTML` function with the following:

```typescript
function generateMonthlyHTML(storeName: string, monthName: string, tv: number, meta: number, pct: number, ranking: any[], year: number) {
    const wppText = encodeURIComponent(`*🏆 FECHAMENTO MENSAL MX - ${storeName}*\n📅 Ref: ${monthName}\n\n🎯 Meta: ${meta}\n🔥 Vendido: ${tv} (${pct}%)\n\n🏆 *Top 3*\n${ranking.slice(0,3).map((r,i) => `${i+1}º ${r.name} - ${r.vt}v`).join('\n')}\n\nConferira o ranking completo no e-mail!`);

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
body{font-family:'Inter',sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:20px;line-height:1.5}
.c{max-width:680px;margin:0 auto;background:#fff;border-radius:24px;box-shadow:0 10px 30px -10px rgba(0,0,0,0.1);overflow:hidden}
.h{background:#0f172a;padding:48px 32px;text-align:center;border-bottom:4px solid #eab308}
.h h1{color:#eab308;margin:0 0 12px;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:2px}.h p{color:#94a3b8;margin:0;font-size:14px;text-transform:uppercase;letter-spacing:3px}
.content{padding:40px 32px}
.ss{display:grid;grid-template-columns:repeat(2, 1fr);gap:16px;margin-bottom:32px}
.s{background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:24px;text-align:center;transition:all 0.3s}
.sv{font-size:42px;font-weight:900;color:#eab308;line-height:1;margin-bottom:8px}.sl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;font-weight:600}
.meta-box{text-align:center;padding:24px;background:#0f172a;border-radius:20px;color:#fff;margin-bottom:40px;box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2)}
.bar-c{height:12px;background:rgba(255,255,255,0.1);border-radius:6px;margin:16px 0;overflow:hidden}
.bar{height:100%;background:linear-gradient(90deg, #eab308 0%, #facc15 100%);border-radius:6px}
table{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:40px}
th{background:#fff;padding:16px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #eab308;font-weight:700}
td{padding:18px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#334155}
.btn{display:block;width:100%;background:#eab308;color:#0f172a;text-align:center;padding:20px;border-radius:14px;text-decoration:none;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;box-shadow:0 4px 14px 0 rgba(234,179,8,0.3)}
.f{text-align:center;padding:32px;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:2px;border-top:1px solid #f1f5f9;background:#fcfcfc}
</style></head><body><div class="c">
<div class="h"><h1>🏆 Fechamento Mensal</h1><p>${storeName} • ${monthName}</p></div>
<div class="content">
<div class="ss">
<div class="s"><div class="sv">${tv}</div><div class="sl">Vendas</div></div>
<div class="s"><div class="sv">${pct}%</div><div class="sl">Atingimento</div></div>
</div>
<div class="meta-box">
<div class="sl" style="color:#94a3b8">Meta do Mês: ${meta} unidades</div>
<div class="bar-c"><div class="bar" style="width:${Math.min(pct, 100)}%"></div></div>
<div style="font-size:12px;font-weight:700;color:${pct >= 100 ? '#eab308' : '#fff'}">${pct >= 100 ? '⭐ META SUPERADA ⭐' : 'Faltaram ' + Math.max(meta - tv, 0) + ' vendas'}</div>
</div>
<h3 style="text-transform:uppercase;letter-spacing:2px;font-size:14px;margin-bottom:20px;color:#0f172a">Ranking de Consultores</h3>
<table><thead><tr><th>Consultor</th><th>Leads</th><th>Visitas</th><th>Vendas</th></tr></thead>
<tbody>${ranking.map((r: any, i: number) => `<tr><td>${i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}${r.name}</td><td>${r.leads}</td><td>${r.vis}</td><td>${r.vt}</td></tr>`).join("")}</tbody></table>
<a href="https://api.whatsapp.com/send?text=${wppText}" class="btn">COMPARTILHAR FEEDBACK WHATSAPP</a>
</div>
<div class="f">MX Authority • PERFORMANCE © ${year}</div>
</div></body></html>`;
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/relatorio-mensal/index.ts
git commit -m "style: upgrade monthly report to prestige branding (Gold/Midnight)"
```

---

### Task 3: Integration and Email Updates

**Files:**
- Modify: `supabase/functions/relatorio-mensal/index.ts`

- [ ] **Step 1: Update main loop to generate CSV and attach to email**

Locate the `for (const store of stores)` loop and update the email sending section:

```typescript
            const monthName = prevMonthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
            const html = generateMonthlyHTML(store.name, monthName, totalVendas, storeGoal, pct, sellers, year);

            // Geração de CSV e nome de arquivo
            const csvBase64 = generateCSV(sellers);
            const displayMonth = prevMonthDate.toLocaleDateString("pt-BR", { month: "long" }).replace(/^\w/, (c) => c.toUpperCase());
            const fileName = `fechamento_mensal_MX_${store.name.replace(/\s+/g, "_")}_${displayMonth}_${year}.csv`;

            // Enviar e-mail
            let emailStatus = "not_sent";
            if (resend && recipients.length > 0) {
                try {
                    await resend.emails.send({
                        from: "MX Relatórios <relatorios@mxperformance.com.br>",
                        to: recipients,
                        subject: `🏆 Relatório Mensal MX: ${store.name} - ${monthName.toUpperCase()}`,
                        html: html,
                        attachments: [
                            {
                                filename: fileName,
                                content: csvBase64,
                            }
                        ]
                    });
                    emailStatus = "sent";
                } catch (err) {
                    console.error(`[Mensal] Error sending email for ${store.name}:`, err);
                    emailStatus = "failed";
                }
            }
```

- [ ] **Step 2: Final Commit**

```bash
git add supabase/functions/relatorio-mensal/index.ts
git commit -m "feat: upgrade monthly closing motor with prestige branding and csv"
```
